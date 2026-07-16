"""Phase 7 — QA endpoint that runs the RAG pipeline against a single report."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from core.db import get_db
from models.models import Report, User, AuditLog, QAHistory
from schemas.schemas import QARequest, QAResponse, QAHistoryItem
from services.rag import answer_question
from api.deps import get_current_user

router = APIRouter(prefix="/api/qa", tags=["qa"])


@router.post("", response_model=QAResponse)
async def ask_question(payload: QARequest, db: DBSession = Depends(get_db),
                        user: User = Depends(get_current_user)):
    report = db.get(Report, payload.report_id)
    if not report or report.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    if report.status != "parsed":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Report is not ready yet")

    # A missing thread_id means "start a new conversation" — generate one now
    # so we can return it and the frontend can keep using it for this thread.
    thread_id = payload.thread_id or str(uuid.uuid4())

    recent = (
        db.query(QAHistory)
        .filter(QAHistory.thread_id == thread_id)
        .order_by(QAHistory.created_at.desc())
        .limit(4)
        .all()
    )
    history = [{"question": r.question, "answer": r.answer} for r in reversed(recent)]

    result = await answer_question(payload.report_id, payload.question, history=history)

    db.add(QAHistory(
        report_id=payload.report_id,
        thread_id=thread_id,
        user_id=user.id,
        question=payload.question,
        answer=result["answer"],
        sources=result["sources"],
    ))
    db.add(AuditLog(user_id=user.id, action="qa_query", meta={"report_id": payload.report_id}))
    db.commit()

    return QAResponse(answer=result["answer"], sources=result["sources"], thread_id=thread_id)


@router.get("/history/{report_id}", response_model=list[QAHistoryItem])
def get_history(report_id: str, db: DBSession = Depends(get_db),
                user: User = Depends(get_current_user)):
    report = db.get(Report, report_id)
    if not report or report.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    rows = (
        db.query(QAHistory)
        .filter(QAHistory.report_id == report_id)
        .order_by(QAHistory.created_at)
        .all()
    )
    return [
        QAHistoryItem(
            id=row.id,
            thread_id=row.thread_id,
            question=row.question,
            answer=row.answer,
            sources=row.sources or [],
            created_at=row.created_at,
        )
        for row in rows
    ]