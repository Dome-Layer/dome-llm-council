from functools import lru_cache
import os

from supabase import create_client, Client


@lru_cache(maxsize=1)
def get_supabase_client() -> Client | None:
    url = os.getenv("SUPABASE_URL", "")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not service_role_key:
        return None
    return create_client(url, service_role_key)
