from supabase import create_client, Client, ClientOptions
from ..config import get_settings


def get_service_role_client() -> Client:
    """Return a Supabase client initialized with the service role key.
    This client bypasses RLS and can query across all users. Useful for
    matching runs and admin tasks.
    """
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase URL and Service Role Key must be configured")
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


def get_supabase_client(user_jwt: str | None = None) -> Client:
    """Return a service-role Supabase client.

    Supabase REST API requires TWO headers on every request:
      - apikey: always the service role key (or anon key)
      - Authorization: Bearer <token>  (determines RLS identity)

    ClientOptions(headers=...) in supabase-py v2 merges into defaults,
    so we set both explicitly to guarantee the apikey is never lost.
    """
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError("Supabase URL and Service Role Key must be configured")

    service_key = settings.supabase_service_role_key
    # If a user JWT is supplied, use it as the Authorization token so RLS
    # evaluates the request as that user; otherwise fall back to service key.
    auth_token = user_jwt if user_jwt else service_key

    options = ClientOptions(
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {auth_token}",
        }
    )
    return create_client(settings.supabase_url, service_key, options=options)
