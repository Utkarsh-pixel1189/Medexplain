"""
FastAPI entry point. On Vercel this is exposed under /api/ via vercel.json
rewrites (see apps/backend/vercel.json). Locally: `uvicorn main:app --reload`.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from core.db import Base, engine
from api import auth, upload, report, qa

# Import models so they register on Base.metadata before create_all/migrations.
from models import models  # noqa: F401

settings = get_settings()

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(report.router)
app.include_router(qa.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "env": settings.ENV}


@app.on_event("startup")
def on_startup():
    # For local/dev convenience only — use Alembic migrations in real
    # deployments instead of create_all (see db/schema.sql + alembic notes in README).
    if settings.ENV == "development":
        Base.metadata.create_all(bind=engine)
