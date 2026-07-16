# Medexplain

Upload a medical-report PDF, get structured lab data + trend charts, and ask
follow-up questions answered via a retrieval-augmented pipeline over Mistral.

This is the first-pass MVP scaffold matching the project roadmap: auth,
secure upload, PDF/OCR parsing, chunking + embeddings, a vector store, entity
extraction, RAG QA, and a dashboard/report-viewer UI.

## Project layout

```
apps/
  frontend/     Next.js 14 (App Router) + TypeScript + Tailwind
    app/        pages: /, /login, /dashboard, /report/[id]
    components/ UploadForm, ReportList, LabChart, QAPanel
    lib/api.ts  fetch wrapper (cookie-based auth)

  backend/      FastAPI
    main.py     app entry point, router registration
    api/        auth, upload/ingest, report, qa routers
    core/       config, db session, password/session security
    models/     SQLAlchemy ORM models
    schemas/    Pydantic request/response models
    services/   parsing (PDF+OCR), chunking, entity_extraction,
                embeddings (Mistral), vector_store, rag, storage (S3)
    db/schema.sql   reference SQL schema (mirrors models/models.py)

docker-compose.yml   local Postgres for dev
```

## Local development

### 1. Backend

```bash
cd apps/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in MISTRAL_API_KEY, S3 credentials, SESSION_SECRET

# Postgres (or run your own)
docker compose -f ../../docker-compose.yml up -d postgres

uvicorn main:app --reload --port 8000
```

Tables are auto-created on startup when `ENV=development` (see
`main.py:on_startup`). Switch to Alembic migrations before deploying to
production — `db/schema.sql` documents the intended schema.

You'll also need `tesseract-ocr` installed locally for the OCR fallback
(`apt install tesseract-ocr` / `brew install tesseract`).

### 2. Frontend

```bash
cd apps/frontend
npm install
cp .env.example .env.local
npm run dev
```

`next.config.js` proxies `/api/*` to `http://localhost:8000` in dev, so the
frontend and backend can run on separate ports without CORS headaches.

Visit `http://localhost:3000`, sign up, and upload a PDF.

## What's implemented vs. stubbed

Implemented and runnable:
- Registration/login/logout with HttpOnly session cookies, bcrypt hashing.
- Presigned S3 upload flow (client uploads directly to storage).
- PDF text extraction (PyMuPDF) with Tesseract OCR fallback per page.
- Regex-based lab/vitals extraction with a small name-normalization table.
- Chunking, Mistral embeddings, and an in-memory vector store (swap-in
  `PineconeVectorStore` skeleton included in `services/vector_store.py`).
- RAG QA endpoint: retrieval scoped to the requesting user's own report,
  a constrained system prompt, source citations, and a "not sure — ask your
  physician" fallback.
- Dashboard (upload + report list with live status polling) and a report
  viewer (PDF preview, lab trend charts via Recharts, QA chat panel).
- Audit log rows for login, upload, parse completion, and QA queries.

Intentionally left as next steps (called out in code comments too):
- Alembic migrations (schema.sql is the reference, not yet wired to `alembic upgrade`).
- Virus scanning step on upload (Phase 3 mentions ClamAV — not wired in).
- MFA (columns exist on `users`, no enrollment/verification flow yet).
- Background job queue — parsing currently runs as a FastAPI `BackgroundTask`,
  fine for an MVP but not durable; swap in a real worker for scale.
- Deployment wiring for Vercel (a `vercel.json` is included for the backend,
  but you'll need to connect real S3/Postgres/vector-store credentials as
  Vercel environment variables).

## Deploying

- **Frontend**: push to a Git repo and import into Vercel; set
  `NEXT_PUBLIC_API_BASE_URL` if the backend lives on a different domain.
- **Backend**: deploy `apps/backend` as a separate Vercel project (the
  included `vercel.json` routes `/api/*` to the Python function), or to any
  host that runs FastAPI (Render, Fly.io, a small VM). Set all vars from
  `.env.example` as real environment variables — never commit `.env`.
- **Database**: any managed Postgres (Neon, Supabase, RDS) works with
  `DATABASE_URL`.
- **Object storage**: AWS S3 or an S3-compatible provider (Cloudflare R2,
  Backblaze B2 + `S3_ENDPOINT_URL`).
- **Vector store**: the in-memory store is dev-only and resets on restart —
  provision Pinecone (or similar) before going live and set
  `VECTOR_STORE_PROVIDER=pinecone`.

## Security notes carried over from the roadmap

- Passwords are bcrypt-hashed; sessions are HttpOnly, signed, DB-backed and
  revocable (not stateless JWTs) — see `core/security.py`.
- Files upload directly to object storage via presigned URLs; the API never
  buffers raw PHI bytes in the upload path.
- The RAG prompt only ever sees retrieved chunk text for the specific report
  being asked about, not the user's full account or other reports.
- Audit logs record *that* a QA query or upload happened, not the PHI content
  itself.
- Before going to production with real patient data: finalize a BAA with
  your cloud/LLM providers if operating under HIPAA, add encryption-at-rest
  key management, and build the deletion/right-to-be-forgotten workflow
  described in the roadmap's Phase 9.
