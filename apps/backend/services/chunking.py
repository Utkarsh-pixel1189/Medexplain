"""
Phase 5 — Chunking. Splits normalized report text into ~200-800 token chunks
along paragraph boundaries so retrieval returns coherent context windows.
"""
import hashlib

from core.config import get_settings

settings = get_settings()


def _approx_token_count(text: str) -> int:
    # Rough heuristic (~4 chars/token) — good enough for chunk sizing;
    # swap for a real tokenizer (tiktoken/mistral tokenizer) if you need precision.
    return max(1, len(text) // 4)


def chunk_text(pages: list[dict]) -> list[dict]:
    """pages: [{page, text, method}, ...] from parsing.extract_text_per_page.
    Returns [{chunk_index, page, text, text_hash}, ...]
    """
    chunks = []
    index = 0
    for page in pages:
        paragraphs = [p.strip() for p in page["text"].split("\n\n") if p.strip()]
        buffer = ""
        for para in paragraphs:
            candidate = f"{buffer}\n\n{para}".strip() if buffer else para
            if _approx_token_count(candidate) > settings.CHUNK_MAX_TOKENS and buffer:
                chunks.append(_make_chunk(index, page["page"], buffer))
                index += 1
                buffer = para
            else:
                buffer = candidate

        if buffer and _approx_token_count(buffer) >= settings.CHUNK_MIN_TOKENS:
            chunks.append(_make_chunk(index, page["page"], buffer))
            index += 1
            buffer = ""

        # leftover under the min-size threshold still gets flushed as its own
        # chunk at page boundaries, rather than silently dropped.
        if buffer:
            chunks.append(_make_chunk(index, page["page"], buffer))
            index += 1

    return chunks


def _make_chunk(index: int, page: int, text: str) -> dict:
    text_hash = hashlib.sha256(text.encode()).hexdigest()
    return {"chunk_index": index, "page": page, "text": text, "text_hash": text_hash}
