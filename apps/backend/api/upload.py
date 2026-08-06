"""Phase 3 — Presigned upload + ingest trigger, and Phase 4 pipeline entry point."""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from core.db import get_db
from models.models import Report, User, AuditLog
from schemas.schemas import PresignRequest, PresignResponse, IngestRequest, ReportOut
from services.storage import build_object_key, presign_put, download_bytes, upload_bytes
from services.parsing import parse_pdf, render_pages_as_jpg
from services.chunking import chunk_text
from services.entity_extraction import extract_entities, extract_entities_llm
from services.embeddings import embed_texts
from services.vector_store import get_vector_store
from api.deps import get_current_user
from models.models import ReportChunk, Embedding, ReportEntity

router = APIRouter(prefix="/api", tags=["upload"])


@router.get("/s3-presign", response_model=PresignResponse)
def s3_presign(filename: str, content_type: str = "application/pdf",
               db: DBSession = Depends(get_db), user: User = Depends(get_current_user)):
    if content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only application/pdf uploads are supported")

    s3_key = build_object_key(user.id, filename)
    url = presign_put(s3_key, content_type)
    return PresignResponse(upload_url=url, s3_key=s3_key)


def _run_pipeline(report_id: str, s3_key: str, db_factory):
    db = db_factory()
    try:
        report = db.get(Report, report_id)
        if not report:
            return
        report.status = "parsing"
        db.commit()

        pdf_bytes = download_bytes(s3_key)
        parsed = parse_pdf(pdf_bytes)
        chunks = chunk_text(parsed["pages"])

        # Render each page as a JPG preview for the report viewer.
        preview_keys = []
        try:
            preview_images = render_pages_as_jpg(pdf_bytes)
            for idx, img_bytes in enumerate(preview_images):
                key = f"previews/{report_id}/page-{idx + 1}.jpg"
                upload_bytes(key, img_bytes, "image/jpeg")
                preview_keys.append(key)
        except Exception:
            preview_keys = []  # preview is best-effort; parsing continues regardless

        import asyncio

        async def _extract_all():
            regex_entities = extract_entities(parsed)
            llm_entities = await extract_entities_llm(parsed["full_text"])

            candidates: dict[str, list[dict]] = {}
            for e in regex_entities + llm_entities:
                key = e["name"].strip().lower()
                candidates.setdefault(key, []).append(e)

            merged = []
            for key, options in candidates.items():
                # Prefer whichever candidate actually captured a reference
                # range — regardless of which pass (regex or LLM) found it —
                # since either can miss it depending on how the OCR text for
                # this particular row came out.
                with_range = [o for o in options if o.get("ref_range")]
                best = with_range[0] if with_range else options[0]
                merged.append(best)

            return merged

        entities = asyncio.run(_extract_all())
        embeddings = asyncio.run(embed_texts([c["text"] for c in chunks])) if chunks else []

        from services.summary import generate_summary
        ai_summary = asyncio.run(generate_summary(parsed["full_text"], entities))

        from services.organ_mapping import map_to_organs
        organ_map = asyncio.run(map_to_organs(entities))

        store = get_vector_store()
        for chunk, embedding in zip(chunks, embeddings):
            embedding_row = Embedding(vector_ref=f"{report_id}:{chunk['chunk_index']}", provider="mistral")
            db.add(embedding_row)
            db.flush()

            chunk_row = ReportChunk(
                report_id=report_id,
                chunk_index=chunk["chunk_index"],
                text=chunk["text"],
                text_hash=chunk["text_hash"],
                page=chunk["page"],
                embedding_id=embedding_row.id,
            )
            db.add(chunk_row)
            db.flush()

            store.upsert(
                vector_id=embedding_row.vector_ref,
                embedding=embedding,
                metadata={
                    "report_id": report_id,
                    "chunk_id": chunk_row.id,
                    "page": chunk["page"],
                    "text": chunk["text"],
                },
            )

        from datetime import datetime as _dt

        for e in entities:
            date_val = e.get("date")
            if isinstance(date_val, str):
                try:
                    e["date"] = _dt.fromisoformat(date_val)
                except ValueError:
                    e["date"] = None
            db.add(ReportEntity(report_id=report_id, **e))

        report.preview_keys = preview_keys
        report.ai_summary = ai_summary
        report.organ_map = organ_map
        report.status = "parsed"
        report.parse_status = "ocr_used" if parsed["used_ocr"] else "text_extracted"
        report.parse_summary = {
            "num_pages": parsed["num_pages"],
            "num_chunks": len(chunks),
            "num_entities": len(entities),
            "sections_found": [k for k, v in parsed["sections"].items() if v],
        }
        db.add(AuditLog(user_id=report.owner_id, action="report_parsed", meta={"report_id": report_id}))
        db.commit()
    except Exception as exc:  # noqa: BLE001
        import traceback
        traceback.print_exc()
        report = db.get(Report, report_id)
        if report:
            report.status = "failed"
            report.parse_summary = {"error": str(exc)}
            db.commit()
    finally:
        db.close()


@router.post("/report/ingest", response_model=ReportOut, status_code=status.HTTP_202_ACCEPTED)
def ingest(payload: IngestRequest, background_tasks: BackgroundTasks,
           db: DBSession = Depends(get_db), user: User = Depends(get_current_user)):
    report = Report(owner_id=user.id, s3_key=payload.s3_key, original_filename=payload.original_filename,
                     status="uploaded")
    db.add(report)
    db.add(AuditLog(user_id=user.id, action="report_uploaded", meta={"filename": payload.original_filename}))
    db.commit()
    db.refresh(report)

    from core.db import SessionLocal
    background_tasks.add_task(_run_pipeline, report.id, report.s3_key, SessionLocal)

    return report