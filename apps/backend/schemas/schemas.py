"""Pydantic request/response models."""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: EmailStr
    first_name: str | None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class PresignRequest(BaseModel):
    filename: str
    content_type: str = "application/pdf"


class PresignResponse(BaseModel):
    upload_url: str
    s3_key: str
    fields: dict | None = None


class IngestRequest(BaseModel):
    s3_key: str
    original_filename: str


class ReportOut(BaseModel):
    id: str
    status: str
    parse_status: str | None
    original_filename: str
    parse_summary: dict | None
    ai_summary: dict | None
    organ_map: list[dict] | None
    created_at: datetime

    class Config:
        from_attributes = True


class EntityOut(BaseModel):
    type: str
    name: str
    value: str | None
    numeric_value: float | None
    unit: str | None
    ref_range: str | None
    date: datetime | None
    flagged: bool
    original_value: str | None

    class Config:
        from_attributes = True


class ChunkOut(BaseModel):
    id: str
    chunk_index: int
    page: int | None
    text: str

    class Config:
        from_attributes = True


class QARequest(BaseModel):
    report_id: str
    question: str = Field(min_length=1, max_length=2000)
    thread_id: str | None = None


class QASource(BaseModel):
    chunk_id: str
    page: int | None
    snippet: str


class QAResponse(BaseModel):
    answer: str
    sources: list[QASource]
    thread_id: str
    disclaimer: str = "This is not medical advice. Always confirm results with your physician."

class QAHistoryItem(BaseModel):
    id: str
    thread_id: str
    question: str
    answer: str
    sources: list[QASource]
    created_at: datetime    
