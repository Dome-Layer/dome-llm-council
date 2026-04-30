import hashlib
import json
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sse_starlette.sse import EventSourceResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

from auth import get_current_user
from config import CouncilConfig, build_council_config
from council.orchestrator import run_deliberation
from log_setup import get_logger, setup_logging
from models.request import DeliberationRequest

setup_logging()
logger = get_logger(__name__)


# Per-IP rate limiter. /deliberate runs up to 7 LLM calls per request, so the
# default ceiling here is intentionally tight — the audit pegs the cost burn
# vector for this endpoint specifically. Per-user tiers (more generous for
# authenticated users) will land alongside the dome-auth extraction in P1.
limiter = Limiter(key_func=get_remote_address)


def _user_token_hash(request: Request) -> Optional[str]:
    """Stable opaque identifier derived from a Bearer token, for log diagnostics
    only. Not used as a rate-limit key today — see comment on `limiter` above."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return "user:" + hashlib.sha256(auth[7:].encode()).hexdigest()[:16]
    return None


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if os.getenv("ENVIRONMENT", "development") == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=63072000; includeSubDomains"
            )
        return response


# Columns that exist in the governance_events table.
# The SSE payload includes extra keys (e.g. "type") that must be stripped before insert.
_GOVERNANCE_EVENT_COLUMNS = {
    "agent_id", "action_type", "timestamp", "input_hash", "input_type",
    "output_summary", "rules_applied", "rules_triggered", "confidence",
    "human_in_loop", "user_id", "metadata",
}

_db_client = None


def _get_db_client(config: CouncilConfig):
    """Return a cached Supabase client, or None if not configured."""
    global _db_client
    if _db_client is not None:
        return _db_client
    if not config.supabase_url or not config.supabase_service_role_key:
        return None
    try:
        from supabase import create_client
        _db_client = create_client(config.supabase_url, config.supabase_service_role_key)
        return _db_client
    except Exception as exc:
        logger.warning("supabase_client_init_failed error=%s", exc)
        return None


def _persist_governance_event(config: CouncilConfig, event_dict: dict) -> None:
    """Optionally write a governance event to the shared DOME Platform Supabase project.

    Non-fatal — a failure here must never interrupt the SSE stream. The tool
    works without Supabase; persistence is purely for the audit trail.
    """
    db = _get_db_client(config)
    if db is None:
        return
    try:
        # Strip SSE envelope keys not present in the table (e.g. "type")
        row = {k: v for k, v in event_dict.items() if k in _GOVERNANCE_EVENT_COLUMNS}
        # Omit null user_id to let the column default to NULL cleanly
        if row.get("user_id") is None:
            row.pop("user_id", None)
        db.table("governance_events").insert(row).execute()
        logger.info("governance_event_persisted")
    except Exception as exc:
        logger.warning("governance_persist_failed error=%s", exc)


_config: Optional[CouncilConfig] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _config
    _config = build_council_config()
    logger.info("Council config loaded — synthesiser: %s", type(_config.synthesizer).__name__)
    yield


app = FastAPI(title="Dome LLM Council", version="1.0.0", lifespan=lifespan)

# Register the slowapi limiter on the app and wire its 429 handler.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def _build_cors_origins() -> list[str]:
    """Build the CORS allowlist from ALLOWED_ORIGINS env var, falling back to
    the public production list if unset. Localhost entries are filtered out
    when ENVIRONMENT=production."""
    env = os.getenv("ENVIRONMENT", "development")
    raw = os.getenv("ALLOWED_ORIGINS", "")
    if raw:
        origins = [o.strip() for o in raw.split(",") if o.strip()]
    else:
        origins = [
            "https://domelayer.com",
            "https://analyzer.domelayer.com",
            "https://data-intelligence.domelayer.com",
            "https://llm-council.domelayer.com",
        ]
    if env == "production":
        origins = [o for o in origins if "localhost" not in o and "127.0.0.1" not in o]
    return origins


# Middleware applied in reverse registration order (last added = outermost).
# CORSMiddleware must be outermost so CORS headers are present on every
# response, including 429s emitted by slowapi.
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_build_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


def _extract_user_id(config: CouncilConfig, req: Request) -> Optional[str]:
    """Extract user_id from the SSO Bearer token if Supabase is configured."""
    if not config.supabase_url or not config.supabase_service_role_key:
        return None
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.removeprefix("Bearer ").strip()
    try:
        from supabase import create_client
        db = create_client(config.supabase_url, config.supabase_service_role_key)
        resp = db.auth.get_user(token)
        return str(resp.user.id) if resp and resp.user else None
    except Exception:
        return None


@app.post("/deliberate")
@limiter.limit("6/minute")  # 1 request per 10s per IP
async def deliberate(request: Request, body: DeliberationRequest) -> EventSourceResponse:
    if _config is None:
        raise HTTPException(status_code=503, detail="Council not initialised")

    user_id = _extract_user_id(_config, request)
    logger.info(
        "deliberate_request",
        user_id=user_id,
        user_token_id=_user_token_hash(request),
        client_ip=get_remote_address(request),
    )

    async def _stream() -> AsyncGenerator[dict, None]:
        try:
            async for payload in run_deliberation(
                body,
                claude=_config.claude,
                gemini=_config.gemini,
                openai=_config.openai,
                synthesizer=_config.synthesizer,
            ):
                if await request.is_disconnected():
                    logger.info("client_disconnected_during_deliberation")
                    break
                yield {"data": payload}
                try:
                    parsed = json.loads(payload)
                    if parsed.get("type") == "governance_event":
                        if user_id:
                            parsed["user_id"] = user_id
                        _persist_governance_event(_config, parsed)
                except Exception:
                    pass
        except Exception as exc:
            logger.error("deliberation_error", error=str(exc), exc_info=True)
            yield {"data": json.dumps({"type": "error", "data": {"message": str(exc)}})}

    return EventSourceResponse(_stream())


# ─── Auth endpoints ──────────────────────────────────────────────────────────

class MagicLinkRequest(BaseModel):
    email: str
    redirect_to: Optional[str] = None


def _is_allowed_redirect(url: str) -> bool:
    """Accept only domelayer.com subdomains and localhost (dev)."""
    import re
    return bool(re.match(r"^https?://(localhost(:\d+)?|[\w-]+\.domelayer\.com)/", url))


@app.post("/api/v1/auth/magic-link", status_code=204)
async def request_magic_link(body: MagicLinkRequest):
    if _config is None or not _config.supabase_url or not _config.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Auth not configured")
    if body.redirect_to and not _is_allowed_redirect(body.redirect_to):
        raise HTTPException(status_code=400, detail="Invalid redirect URL")
    try:
        from supabase import create_client
        db = create_client(_config.supabase_url, _config.supabase_service_role_key)
        payload: dict = {"email": body.email}
        if body.redirect_to:
            payload["options"] = {"email_redirect_to": body.redirect_to}
        db.auth.sign_in_with_otp(payload)
    except Exception as exc:
        logger.error("magic_link_failed error=%s", exc)
        raise HTTPException(status_code=500, detail="Failed to send magic link")


@app.delete("/api/v1/auth/session", status_code=204)
async def delete_session(req: Request):
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer ") or not _config:
        return
    token = auth.removeprefix("Bearer ").strip()
    if token:
        try:
            db = _get_db_client(_config)
            if db:
                db.auth.admin.sign_out(token)
        except Exception:
            pass  # best-effort


# ─── Saved deliberations ─────────────────────────────────────────────────────

class SaveDeliberationRequest(BaseModel):
    question: str
    verdict_summary: str
    consensus_confidence: float
    label: Optional[str] = None
    full_payload: Optional[dict] = None


@app.post("/api/v1/deliberations/{deliberation_id}/save")
async def save_deliberation(deliberation_id: str, body: SaveDeliberationRequest, req: Request, user: dict = Depends(get_current_user)):
    if _config is None:
        raise HTTPException(status_code=503, detail="Council not initialised")
    user_id = user["user_id"]
    db = _get_db_client(_config)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        now = datetime.now(timezone.utc).isoformat()
        row = {
            "deliberation_id": deliberation_id,
            "user_id": user_id,
            "question": body.question,
            "verdict_summary": body.verdict_summary,
            "consensus_confidence": body.consensus_confidence,
            "label": body.label,
            "saved_at": now,
            "full_payload": body.full_payload,
        }
        db.table("deliberations").insert(row).execute()
        return {"saved": True, "saved_at": now}
    except Exception as exc:
        logger.error("save_deliberation_failed error=%s", exc)
        raise HTTPException(status_code=500, detail="Failed to save deliberation")


@app.get("/api/v1/deliberations")
async def list_deliberations(req: Request, user: dict = Depends(get_current_user)):
    if _config is None:
        raise HTTPException(status_code=503, detail="Council not initialised")
    user_id = user["user_id"]
    db = _get_db_client(_config)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        result = (
            db.table("deliberations")
            .select("*")
            .eq("user_id", user_id)
            .order("saved_at", desc=True)
            .execute()
        )
        return {"deliberations": result.data}
    except Exception as exc:
        logger.error("list_deliberations_failed error=%s", exc)
        raise HTTPException(status_code=500, detail="Failed to list deliberations")


@app.delete("/api/v1/deliberations/{deliberation_id}", status_code=204)
async def delete_deliberation_endpoint(deliberation_id: str, req: Request, user: dict = Depends(get_current_user)):
    if _config is None:
        raise HTTPException(status_code=503, detail="Council not initialised")
    user_id = user["user_id"]
    db = _get_db_client(_config)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        db.table("deliberations").delete().eq("id", deliberation_id).eq("user_id", user_id).execute()
    except Exception as exc:
        logger.error("delete_deliberation_failed error=%s", exc)
        raise HTTPException(status_code=500, detail="Failed to delete deliberation")
