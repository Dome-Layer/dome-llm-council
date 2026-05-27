import os

from dome_core.db import get_db_optional


def get_supabase_client():
    return get_db_optional(
        url=os.getenv("SUPABASE_URL") or None,
        service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY") or None,
    )


__all__ = ["get_supabase_client"]
