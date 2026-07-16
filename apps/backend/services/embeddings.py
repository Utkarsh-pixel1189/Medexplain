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

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            MISTRAL_EMBED_URL,
            headers={"Authorization": f"Bearer {settings.MISTRAL_API_KEY}"},
            json={"model": settings.MISTRAL_EMBED_MODEL, "input": texts},
        )
        resp.raise_for_status()
        data = resp.json()
        return [item["embedding"] for item in data["data"]]


async def embed_text(text: str) -> list[float]:
    return (await embed_texts([text]))[0]
