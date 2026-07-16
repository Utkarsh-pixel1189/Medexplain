"""
SQLAlchemy ORM models matching the data model in the roadmap:
users, sessions, reports, report_chunks, embeddings, report_entities, audit_logs.
"""
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, JSON, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.db import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, default="user")  # user | admin
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_secret: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_login: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
    reports: Mapped[list["Report"]] = relationship(back_populates="owner")


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    ip_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="sessions")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    owner_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    s3_key: Mapped[str] = mapped_column(String, nullable=False)
    original_filename: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="uploaded")
    # uploaded -> scanning -> parsing -> parsed -> failed
    parse_summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    parse_status: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner: Mapped["User"] = relationship(back_populates="reports")
    chunks: Mapped[list["ReportChunk"]] = relationship(back_populates="report", cascade="all, delete-orphan")
    entities: Mapped[list["ReportEntity"]] = relationship(back_populates="report", cascade="all, delete-orphan")


class ReportChunk(Base):
    __tablename__ = "report_chunks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    report_id: Mapped[str] = mapped_column(String, ForeignKey("reports.id"), nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    text_hash: Mapped[str] = mapped_column(String, nullable=False)
    page: Mapped[int | None] = mapped_column(Integer, nullable=True)
    embedding_id: Mapped[str | None] = mapped_column(String, ForeignKey("embeddings.id"), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    report: Mapped["Report"] = relationship(back_populates="chunks")
    embedding: Mapped["Embedding | None"] = relationship()


class Embedding(Base):
    __tablename__ = "embeddings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    vector_ref: Mapped[str] = mapped_column(String, nullable=False)  # id/key in the vector store
    provider: Mapped[str] = mapped_column(String, nullable=False)
    dims: Mapped[int | None] = mapped_column(Integer, nullable=True)
    vector: Mapped[list | None] = mapped_column(JSON, nullable=True)  # the actual embedding floats
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ReportEntity(Base):
    __tablename__ = "report_entities"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    report_id: Mapped[str] = mapped_column(String, ForeignKey("reports.id"), nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)  # lab | medication | diagnosis | vital
    name: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[str | None] = mapped_column(String, nullable=True)
    numeric_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str | None] = mapped_column(String, nullable=True)
    ref_range: Mapped[str | None] = mapped_column(String, nullable=True)
    date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    report: Mapped["Report"] = relationship(back_populates="entities")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    user_id: Mapped[str | None] = mapped_column(String, ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String, nullable=False)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

class QAHistory(Base):
    __tablename__ = "qa_history"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    report_id: Mapped[str] = mapped_column(String, ForeignKey("reports.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    sources: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)    
