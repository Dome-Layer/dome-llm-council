import json
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from config import CouncilConfig, build_council_config
from council.orchestrator import run_deliberation
from models.request import DeliberationRequest

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
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
async def deliberate(body: DeliberationRequest, req: Request) -> EventSourceResponse:
    if _config is None:
        raise HTTPException(status_code=503, detail="Council not initialised")

    user_id = _extract_user_id(_config, req)

    async def _stream() -> AsyncGenerator[dict, None]:
        try:
            async for payload in run_deliberation(
                body,
                claude=_config.claude,
                gemini=_config.gemini,
                openai=_config.openai,
                synthesizer=_config.synthesizer,
            ):
                if await req.is_disconnected():
                    logger.info("Client disconnected — stopping deliberation")
                    break
                yield {"data": payload}
                # Persist governance event to shared DOME Platform project after streaming it
                try:
                    parsed = json.loads(payload)
                    if parsed.get("type") == "governance_event":
                        if user_id:
                            parsed["user_id"] = user_id
                        _persist_governance_event(_config, parsed)
                except Exception:
                    pass
        except Exception as exc:
            logger.error("Deliberation error: %s", exc, exc_info=True)
            yield {"data": json.dumps({"type": "error", "data": {"message": str(exc)}})}

    return EventSourceResponse(_stream())


# ─── Auth endpoints ──────────────────────────────────────────────────────────

class MagicLinkRequest(BaseModel):
    email: str


@app.post("/api/v1/auth/magic-link", status_code=204)
async def request_magic_link(body: MagicLinkRequest):
    if _config is None or not _config.supabase_url or not _config.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Auth not configured")
    try:
        from supabase import create_client
        db = create_client(_config.supabase_url, _config.supabase_service_role_key)
        db.auth.admin.generate_link({"type": "magiclink", "email": body.email})
    except Exception as exc:
        logger.error("magic_link_failed error=%s", exc)
        raise HTTPException(status_code=500, detail="Failed to send magic link")


@app.delete("/api/v1/auth/session", status_code=204)
async def delete_session(req: Request):
    user_id = _extract_user_id(_config, req) if _config else None
    if user_id and _config:
        try:
            db = _get_db_client(_config)
            if db:
                db.auth.admin.delete_user(user_id)
        except Exception:
            pass  # best-effort


# ─── Saved deliberations ─────────────────────────────────────────────────────

class SaveDeliberationRequest(BaseModel):
    question: str
    verdict_summary: str
    consensus_confidence: float
    label: Optional[str] = None


@app.post("/api/v1/deliberations/{deliberation_id}/save")
async def save_deliberation(deliberation_id: str, body: SaveDeliberationRequest, req: Request):
    if _config is None:
        raise HTTPException(status_code=503, detail="Council not initialised")
    user_id = _extract_user_id(_config, req)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
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
        }
        db.table("deliberations").insert(row).execute()
        return {"saved": True, "saved_at": now}
    except Exception as exc:
        logger.error("save_deliberation_failed error=%s", exc)
        raise HTTPException(status_code=500, detail="Failed to save deliberation")


@app.get("/api/v1/deliberations")
async def list_deliberations(req: Request):
    if _config is None:
        raise HTTPException(status_code=503, detail="Council not initialised")
    user_id = _extract_user_id(_config, req)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
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
async def delete_deliberation_endpoint(deliberation_id: str, req: Request):
    if _config is None:
        raise HTTPException(status_code=503, detail="Council not initialised")
    user_id = _extract_user_id(_config, req)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    db = _get_db_client(_config)
    if db is None:
        raise HTTPException(status_code=503, detail="Database not configured")
    try:
        db.table("deliberations").delete().eq("id", deliberation_id).eq("user_id", user_id).execute()
    except Exception as exc:
        logger.error("delete_deliberation_failed error=%s", exc)
        raise HTTPException(status_code=500, detail="Failed to delete deliberation")
