"""
Phase 7 — RAG QA orchestration.

Flow: sanitize question -> embed -> retrieve top-K chunks for this report only
-> build a constrained prompt -> call Mistral chat -> return answer + sources.

Safety notes baked in:
- Retrieval is filtered to the requesting user's own report_id (enforced by the
  caller passing only that report's chunks/embedding ids — never cross-report).
- The system prompt instructs the model to answer only from provided context
  and to defer to a physician when unsure, rather than speculate.
- Only the retrieved chunk text is sent to the LLM, not the full report or
  account details.
"""
import re
import httpx

from core.config import get_settings
from services.embeddings import embed_text
from services.vector_store import get_vector_store

settings = get_settings()
MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions"

SYSTEM_PROMPT = (
    "You are a careful medical-report explainer helping a patient understand their own "
    "lab/report results. Answer ONLY using the provided report excerpts. "
    "If the excerpts don't contain the answer, say you're not sure and suggest asking "
    "their physician — do not guess or invent values. Give a thorough, plain-language "
    "explanation: define any medical terms you use, explain what each relevant value or "
    "finding means and why it matters, and note what a normal/expected result usually looks "
    "like for comparison when that context is available. Cite which excerpt (by [source N]) "
    "supports each claim. Never provide a diagnosis or treatment recommendation; explain "
    "what the data shows and encourage follow-up with a clinician for interpretation. "
    "Write in plain text only — no markdown, no asterisks for bold/italic, no bullet symbols "
    "like '-' or '*'; use plain sentences and numbered lists like '1)' if you need a list."
)


# Very small PII scrub for the outgoing question — extend as needed.
PII_PATTERNS = [
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),  # SSN-like
    re.compile(r"\b\d{10,}\b"),  # long numeric IDs / phone numbers
]


def sanitize_question(question: str) -> str:
    cleaned = question
    for pattern in PII_PATTERNS:
        cleaned = pattern.sub("[redacted]", cleaned)
    return cleaned.strip()


async def retrieve_chunks(report_id: str, question: str, top_k: int) -> list[dict]:
    query_embedding = await embed_text(question)
    store = get_vector_store()
    matches = store.query(query_embedding, top_k=top_k, filter={"report_id": report_id})
    return matches


def build_prompt(question: str, chunks: list[dict]) -> list[dict]:
    context_blocks = []
    for i, c in enumerate(chunks, start=1):
        snippet = c["metadata"].get("text", "")
        context_blocks.append(f"[source {i}] (page {c['metadata'].get('page')}): {snippet}")

    context = "\n\n".join(context_blocks) if context_blocks else "(no matching excerpts found)"

    user_content = (
        f"Report excerpts:\n{context}\n\n"
        f"Patient question: {question}\n\n"
        "Answer using only the excerpts above, citing [source N] for each claim."
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]


async def call_mistral_chat(messages: list[dict]) -> str:
    if not settings.MISTRAL_API_KEY:
        raise RuntimeError("MISTRAL_API_KEY is not set — add it to your .env")

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            MISTRAL_CHAT_URL,
            headers={"Authorization": f"Bearer {settings.MISTRAL_API_KEY}"},
            json={
                "model": settings.MISTRAL_CHAT_MODEL,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 900,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def answer_question(report_id: str, question: str) -> dict:
    clean_question = sanitize_question(question)
    chunks = await retrieve_chunks(report_id, clean_question, settings.RAG_TOP_K)

    if not chunks:
        return {
            "answer": (
                "I couldn't find anything relevant in this report to answer that. "
                "Please ask your physician directly, or rephrase the question."
            ),
            "sources": [],
        }

    messages = build_prompt(clean_question, chunks)
    answer = await call_mistral_chat(messages)

    sources = [
        {
            "chunk_id": c["metadata"].get("chunk_id"),
            "page": c["metadata"].get("page"),
            "snippet": c["metadata"].get("text", "")[:240],
        }
        for c in chunks
    ]

    return {"answer": answer, "sources": sources}
