"""Phase 7 — QA endpoint that runs the RAG pipeline against a single report."""
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

    # Pull the last few exchanges for this report so follow-up questions
    # ("is that normal?", "what about the other one?") have context.
    recent = (
        db.query(QAHistory)
        .filter(QAHistory.report_id == payload.report_id)
        .order_by(QAHistory.created_at.desc())
        .limit(4)
        .all()
    )
    history = [{"question": r.question, "answer": r.answer} for r in reversed(recent)]

    result = await answer_question(payload.report_id, payload.question, history=history)

    db.add(QAHistory(
        report_id=payload.report_id,
        user_id=user.id,
        question=payload.question,
        answer=result["answer"],
        sources=result["sources"],
    ))
    db.add(AuditLog(user_id=user.id, action="qa_query", meta={"report_id": payload.report_id}))
    db.commit()

    return QAResponse(answer=result["answer"], sources=result["sources"])


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
            question=row.question,
            answer=row.answer,
            sources=row.sources or [],
            created_at=row.created_at,
        )
        for row in rows
    ]