"""Phase 7 — QA endpoint that runs the RAG pipeline against a single report."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from core.db import get_db
from models.models import Report, User, AuditLog
from schemas.schemas import QARequest, QAResponse
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

    result = await answer_question(payload.report_id, payload.question)

    # Audit that a QA query touching this report's PHI was made — not the
    # question/answer content itself, to avoid duplicating PHI into logs.
    db.add(AuditLog(user_id=user.id, action="qa_query", meta={"report_id": payload.report_id}))
    db.commit()

    return QAResponse(answer=result["answer"], sources=result["sources"])
