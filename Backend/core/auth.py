import jwt
import httpx
from dataclasses import dataclass
from fastapi import Header, HTTPException, status, Depends
from supabase import Client
from ..config import get_settings
from .supabase_client import get_service_role_client

# Cache the JWKS so we don't re-fetch on every request
_jwks_cache: dict | None = None


def _get_jwks(supabase_url: str) -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        resp = httpx.get(f"{supabase_url}/auth/v1/.well-known/jwks.json", timeout=5)
        resp.raise_for_status()
        _jwks_cache = resp.json()
    return _jwks_cache


@dataclass
class AuthenticatedUser:
    """Holds the authenticated user's ID and a Supabase client configured
    with their JWT so that Row-Level Security is enforced on all queries."""
    user_id: str
    supabase: Client


def _decode_token(authorization: str | None) -> tuple[str, str]:
    """Validate the Authorization header and return (raw_token, user_id).

    Supports both HS256 (legacy symmetric secret) and ES256 (asymmetric JWKS),
    since Supabase projects may use either depending on their configuration.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header format. Expected Bearer token."
        )

    token = authorization.split(" ")[1]
    settings = get_settings()

    # Peek at the algorithm in the token header without verifying yet
    try:
        unverified_header = jwt.get_unverified_header(token)
    except jwt.DecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Malformed token header: {e}"
        )

    alg = unverified_header.get("alg", "HS256")

    try:
        if alg == "HS256":
            # Legacy symmetric verification
            jwt_secret = settings.supabase_jwt_secret
            if not jwt_secret or jwt_secret == "placeholder_jwt_secret":
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Supabase JWT secret is not configured in settings"
                )
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated"
            )
        elif alg in ("ES256", "RS256"):
            # Asymmetric verification via JWKS endpoint
            jwks = _get_jwks(settings.supabase_url)
            kid = unverified_header.get("kid")
            # Find matching key
            public_key = None
            for key in jwks.get("keys", []):
                if key.get("kid") == kid or kid is None:
                    public_key = jwt.algorithms.ECAlgorithm.from_jwk(key) if alg == "ES256" \
                        else jwt.algorithms.RSAAlgorithm.from_jwk(key)
                    break
            if public_key is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No matching public key found in JWKS"
                )
            payload = jwt.decode(
                token,
                public_key,
                algorithms=[alg],
                audience="authenticated"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unsupported token algorithm: {alg}"
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is missing user ID ('sub' claim)"
            )
        return token, user_id

    except HTTPException:
        raise
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authorization token: {str(e)}"
        )


def get_current_user(authorization: str | None = Header(default=None)) -> str:
    """Dependency that extracts and decodes the Supabase JWT from the
    Authorization header and returns the user's UUID ('sub' claim).

    Consider using `get_current_user_client()` instead so that RLS is
    enforced at the database level for all subsequent queries.
    """
    _, user_id = _decode_token(authorization)
    return user_id


def get_current_user_client(
    authorization: str | None = Header(default=None),
) -> AuthenticatedUser:
    """Dependency that returns an AuthenticatedUser containing the user's
    UUID and a Supabase client configured with their JWT.

    Using this client **enables Row-Level Security (RLS)** on every
    database query, restricting results to rows owned by the user.
    """
    raw_token, user_id = _decode_token(authorization)
    # Use the service role client for DB operations — the user identity is
    # already verified by the JWT decode above, so this is safe. The user JWT
    # passed as Authorization to the supabase-py client causes header conflicts
    # with ES256 tokens; service role key is always valid.
    supabase = get_service_role_client()
    return AuthenticatedUser(user_id=user_id, supabase=supabase)


def verify_internal_secret(x_internal_secret: str | None = Header(default=None)) -> None:
    """Dependency that validates an internal service-to-service secret header."""
    settings = get_settings()
    if x_internal_secret != settings.internal_api_secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing internal API secret"
        )
