import logging
import os

from dome_core.auth import AuthError, Principal, make_supabase_fallback, verify_jwt
from fastapi import HTTPException, Request

from db import get_supabase_client

logger = logging.getLogger(__name__)

# Validates a token via the legacy supabase.auth.get_user round-trip; used only
# when local JWKS verification can't reach a signing key (DA-005 resilience).
_network_fallback = make_supabase_fallback(get_supabase_client)


def get_current_user(request: Request) -> dict:
    """Dependency: extract and verify the Supabase auth token.

    Verifies the JWT signature locally against Supabase's published JWKS
    (dome-core ``verify_jwt``), falling back to a live ``get_user`` call only on
    JWKS-infrastructure failure. Returns a dict with 'user_id' and 'email'.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header.")

    token = auth_header.removeprefix("Bearer ").strip()
    try:
        principal: Principal = verify_jwt(
            token,
            supabase_url=os.getenv("SUPABASE_URL"),
            network_fallback=_network_fallback,
        )
        return {"user_id": principal.user_id, "email": principal.email}
    except AuthError as e:
        logger.warning("auth_verification_failed error=%s", str(e))
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
