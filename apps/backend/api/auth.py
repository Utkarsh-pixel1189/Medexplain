"""Phase 2 — Registration, login, logout, session cookie management."""
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session as DBSession

from core.config import get_settings
from core.db import get_db
from core.security import (
    hash_password, verify_password, new_session_id,
    create_session_token, hash_ip,
)
from models.models import User, Session as SessionModel, AuditLog
from schemas.schemas import RegisterRequest, LoginRequest, UserOut
from api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


def _issue_session(response: Response, db: DBSession, user: User, request: Request) -> None:
    session_id = new_session_id()
    token = create_session_token(session_id)
    expires_at = datetime.utcnow() + timedelta(minutes=settings.SESSION_TTL_MINUTES)

    session = SessionModel(
        id=session_id,
        user_id=user.id,
        token_hash=token,  # token itself is HMAC-signed; storing it lets us revoke by id
        expires_at=expires_at,
        ip_hash=hash_ip(request.client.host if request.client else "unknown"),
    )
    db.add(session)
    db.add(AuditLog(user_id=user.id, action="login", meta={}))
    db.commit()

    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.SESSION_TTL_MINUTES * 60,
    )


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, response: Response, request: Request, db: DBSession = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    _issue_session(response, db, user, request)
    return user


@router.post("/login", response_model=UserOut)
def login(payload: LoginRequest, response: Response, request: Request, db: DBSession = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        # Same error for both cases so we don't leak which emails are registered.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user.last_login = datetime.utcnow()
    db.commit()

    _issue_session(response, db, user, request)
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request, response: Response, db: DBSession = Depends(get_db),
           user: User = Depends(get_current_user)):
    from core.security import verify_session_token
    token = request.cookies.get(settings.COOKIE_NAME)
    session_id = verify_session_token(token) if token else None
    if session_id:
        session = db.get(SessionModel, session_id)
        if session:
            session.revoked = True
            db.commit()
    response.delete_cookie(settings.COOKIE_NAME)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
