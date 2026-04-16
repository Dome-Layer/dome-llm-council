from functools import lru_cache
import os

from supabase import create_client, Client


@lru_cache(maxsize=1)
def get_supabase_client() -> Client | None:
    url = os.getenv("SUPABASE_URL", "")
    anon_key = os.getenv("SUPABASE_ANON_KEY", "")
    if not url or not anon_key:
        return None
    return create_client(url, anon_key)
