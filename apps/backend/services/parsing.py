"""
Phase 4 — PDF parsing & OCR pipeline.

Strategy:
1. Try embedded text extraction (PyMuPDF). Cheap and accurate for text-native PDFs.
2. If a page yields little/no text, rasterize it and run Tesseract OCR as a fallback
   (handles scanned reports / photographed reports).
3. Normalize whitespace/unicode and produce a structured JSON skeleton
   (findings / impression / labs) for downstream entity extraction.
"""
import base64
import io
import re
import unicodedata

import fitz  # PyMuPDF
import httpx
from PIL import Image

from core.config import get_settings
MIN_CHARS_FOR_TEXT_LAYER = 20  # below this, assume the page needs OCR


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)
    # collapse repeated whitespace, keep paragraph breaks
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions"

OCR_VISION_PROMPT = (
    "Transcribe ALL text visible in this document image exactly as it appears, "
    "preserving the layout as plain text: keep tables as rows with values and "
    "units aligned to their labels, preserve line breaks between sections, and "
    "do not summarize, translate, or omit anything. Output only the transcribed "
    "text — no commentary, no markdown formatting, no code fences."
)


def _ocr_with_mistral_vision(png_bytes: bytes) -> str:
    """Uses Mistral's vision-capable model (Pixtral) to transcribe a scanned
    page. A vision-language model reads the whole page contextually — table
    structure, column alignment, labels next to values — which avoids the
    column-bleed misreads that plague character-by-character OCR engines on
    tabular documents like lab reports."""
    settings = get_settings()
    if not settings.MISTRAL_API_KEY:
        raise RuntimeError("MISTRAL_API_KEY is not set — add it to your .env")

    b64_image = base64.b64encode(png_bytes).decode("utf-8")

    with httpx.Client(timeout=90) as client:
        resp = client.post(
            MISTRAL_CHAT_URL,
            headers={"Authorization": f"Bearer {settings.MISTRAL_API_KEY}"},
            json={
                "model": settings.MISTRAL_VISION_MODEL,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": OCR_VISION_PROMPT},
                            {"type": "image_url", "image_url": f"data:image/png;base64,{b64_image}"},
                        ],
                    }
                ],
                "temperature": 0.0,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


def extract_text_per_page(pdf_bytes: bytes) -> list[dict]:
    """Returns [{page: int, text: str, method: 'text'|'ocr'}, ...]"""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for i, page in enumerate(doc):
        raw = page.get_text("text")
        if len(raw.strip()) >= MIN_CHARS_FOR_TEXT_LAYER:
            pages.append({"page": i + 1, "text": normalize_text(raw), "method": "text"})
            continue

        # Fallback to OCR: rasterize the page and let Mistral's vision model
        # read it directly, understanding table structure rather than
        # matching characters in isolation.
        pix = page.get_pixmap(dpi=300)
        png_bytes = pix.tobytes("png")
        ocr_text = _ocr_with_mistral_vision(png_bytes)
        pages.append({
            "page": i + 1,
            "text": normalize_text(ocr_text),
            "method": "ocr",
            "image_bytes": png_bytes,  # kept for direct vision-based entity extraction
        })
    doc.close()
    return pages


SECTION_HEADERS = {
    "findings": re.compile(r"^\s*findings?\s*:?\s*$", re.IGNORECASE | re.MULTILINE),
    "impression": re.compile(r"^\s*impression\s*:?\s*$", re.IGNORECASE | re.MULTILINE),
}


def split_into_sections(full_text: str) -> dict:
    """Very lightweight section splitter looking for common radiology/lab
    report headers. Falls back to putting everything under 'body' if no
    headers are found — the LLM-based QA step can still work off raw chunks
    even when this heuristic misses."""
    sections = {"findings": None, "impression": None, "body": full_text}

    findings_match = SECTION_HEADERS["findings"].search(full_text)
    impression_match = SECTION_HEADERS["impression"].search(full_text)

    if findings_match and impression_match:
        sections["findings"] = full_text[findings_match.end():impression_match.start()].strip()
        sections["impression"] = full_text[impression_match.end():].strip()
    elif impression_match:
        sections["impression"] = full_text[impression_match.end():].strip()

    return sections


def parse_pdf(pdf_bytes: bytes) -> dict:
    pages = extract_text_per_page(pdf_bytes)
    full_text = "\n\n".join(p["text"] for p in pages)
    sections = split_into_sections(full_text)
    used_ocr = any(p["method"] == "ocr" for p in pages)

    return {
        "pages": pages,
        "full_text": full_text,
        "sections": sections,
        "used_ocr": used_ocr,
        "num_pages": len(pages),
    }

def render_pages_as_jpg(pdf_bytes: bytes, dpi: int = 150) -> list[bytes]:
    """Renders each page as a JPG for the report viewer's image preview."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    images = []
    for page in doc:
        pix = page.get_pixmap(dpi=dpi)
        img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85)
        images.append(buf.getvalue())
    doc.close()
    return images
