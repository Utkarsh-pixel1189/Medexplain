"""Report listing, detail, presigned PDF read, and chunk retrieval endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from core.db import get_db
from models.models import Report, ReportEntity, ReportChunk, User
from schemas.schemas import ReportOut, EntityOut, ChunkOut
from services.storage import presign_get
from api.deps import get_current_user

router = APIRouter(prefix="/api/report", tags=["reports"])


def _get_owned_report(report_id: str, db: DBSession, user: User) -> Report:
    report = db.get(Report, report_id)
    if not report or report.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.get("", response_model=list[ReportOut])
def list_reports(db: DBSession = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Report).filter(Report.owner_id == user.id).order_by(Report.created_at.desc()).all()


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: str, db: DBSession = Depends(get_db), user: User = Depends(get_current_user)):
    return _get_owned_report(report_id, db, user)


@router.get("/{report_id}/entities", response_model=list[EntityOut])
def get_entities(report_id: str, db: DBSession = Depends(get_db), user: User = Depends(get_current_user)):
    _get_owned_report(report_id, db, user)
    return db.query(ReportEntity).filter(ReportEntity.report_id == report_id).all()


@router.get("/{report_id}/pdf")
def get_pdf_url(report_id: str, db: DBSession = Depends(get_db), user: User = Depends(get_current_user)):
    report = _get_owned_report(report_id, db, user)
    return {"url": presign_get(report.s3_key)}


@router.get("/{report_id}/chunks", response_model=list[ChunkOut])
def get_chunks(report_id: str, db: DBSession = Depends(get_db), user: User = Depends(get_current_user)):
    _get_owned_report(report_id, db, user)
    return (
        db.query(ReportChunk)
        .filter(ReportChunk.report_id == report_id)
        .order_by(ReportChunk.chunk_index)
        .all()
    )
