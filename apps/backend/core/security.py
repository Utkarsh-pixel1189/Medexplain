"""
Password hashing + signed session tokens (HttpOnly cookie based, per the roadmap's
Phase 2 recommendation that cookies are safer than JWT-in-localStorage for PHI apps).
"""
import hashlib
import hmac
import secrets
import time

from passlib.context import CryptContext

from core.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _sign(payload: str) -> str:
    return hmac.new(settings.SESSION_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()


def create_session_token(session_id: str) -> str:
    """Opaque, tamper-evident token stored in the HttpOnly cookie.
    The DB is still the source of truth for validity/expiry/revocation.
    """
    signature = _sign(session_id)
    return f"{session_id}.{signature}"


def verify_session_token(token: str) -> str | None:
    """Returns the session_id if the token signature is valid, else None."""
    try:
        session_id, signature = token.split(".", 1)
    except ValueError:
        return None
    expected = _sign(session_id)
    if not hmac.compare_digest(signature, expected):
        return None
    return session_id


def new_session_id() -> str:
    return secrets.token_urlsafe(32)


def hash_ip(ip: str) -> str:
    """Store a hash instead of the raw IP in audit logs to limit PHI exposure."""
    return hashlib.sha256((ip + settings.SESSION_SECRET).encode()).hexdigest()


def now_ts() -> int:
    return int(time.time())
