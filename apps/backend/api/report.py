"""Report listing, detail, presigned PDF read, chunk retrieval, and deletion."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from core.db import get_db
from models.models import Report, ReportEntity, ReportChunk, User, AuditLog, Embedding, QAHistory
from schemas.schemas import ReportOut, EntityOut, ChunkOut
from services.storage import presign_get, delete_object
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


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: str, db: DBSession = Depends(get_db), user: User = Depends(get_current_user)):
    report = _get_owned_report(report_id, db, user)

    # Order matters here: report_chunks.embedding_id references embeddings,
    # so chunks must be deleted before their embeddings, and QA history
    # references report_id directly and must go before the report itself.
    embedding_ids = [c.embedding_id for c in report.chunks if c.embedding_id]

    db.query(QAHistory).filter(QAHistory.report_id == report_id).delete(synchronize_session=False)
    db.query(ReportChunk).filter(ReportChunk.report_id == report_id).delete(synchronize_session=False)
    if embedding_ids:
        db.query(Embedding).filter(Embedding.id.in_(embedding_ids)).delete(synchronize_session=False)

    # Best-effort removal from object storage — a storage hiccup shouldn't
    # block the user from removing the report from their account.
    try:
        delete_object(report.s3_key)
    except Exception:
        pass

    db.add(AuditLog(user_id=user.id, action="report_deleted", meta={"report_id": report_id}))
    db.delete(report)
    db.commit()