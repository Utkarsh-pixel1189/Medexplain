"""
Embedding generation via the Mistral API.
"""
import httpx

from core.config import get_settings

settings = get_settings()
MISTRAL_EMBED_URL = "https://api.mistral.ai/v1/embeddings"


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if not settings.MISTRAL_API_KEY:
        raise RuntimeError("MISTRAL_API_KEY is not set — add it to your .env")

    from services.mistral_client import post_with_retry

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await post_with_retry(
            client,
            MISTRAL_EMBED_URL,
            headers={"Authorization": f"Bearer {settings.MISTRAL_API_KEY}"},
            json={"model": settings.MISTRAL_EMBED_MODEL, "input": texts},
        )
        data = resp.json()
        return [item["embedding"] for item in data["data"]]


async def embed_text(text: str) -> list[float]:
    return (await embed_texts([text]))[0]

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