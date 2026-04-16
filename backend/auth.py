import logging

from fastapi import HTTPException, Request

from db import get_supabase_client

logger = logging.getLogger(__name__)


def get_current_user(request: Request) -> dict:
    """Dependency: extract and verify the Supabase auth token.
    Returns a dict with 'user_id' and 'email'.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header."
        )

    token = auth_header.removeprefix("Bearer ").strip()
    supabase = get_supabase_client()

    if supabase is None:
        raise HTTPException(status_code=503, detail="Auth not configured.")

    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token.")
        return {"user_id": user.id, "email": user.email}
    except HTTPException:
        raise
    except Exception as e:
        logger.warning("auth_verification_failed error=%s", str(e))
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
