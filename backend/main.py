import json
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from config import CouncilConfig, build_council_config
from council.orchestrator import run_deliberation
from models.request import DeliberationRequest

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)


def _persist_governance_event(config: CouncilConfig, event_dict: dict) -> None:
    """Optionally write a governance event to the shared DOME Platform Supabase project.

    Non-fatal — a failure here must never interrupt the SSE stream. The tool
    works without Supabase; persistence is purely for the audit trail.
    """
    if not config.supabase_url or not config.supabase_service_role_key:
        return
    try:
        from supabase import create_client
        db = create_client(config.supabase_url, config.supabase_service_role_key)
        db.table("governance_events").insert(event_dict).execute()
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
    allow_methods=["GET", "POST", "OPTIONS"],
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
