"""
Shared helper for calling the Mistral API with automatic retry on rate
limits (HTTP 429). The pipeline now makes several Mistral calls per upload
(OCR, entity extraction, embeddings, summary) in quick succession, which can
exceed the account's requests-per-second limit — retrying with backoff
instead of failing outright makes the pipeline resilient to that.
"""
import asyncio
import httpx


async def post_with_retry(
    client: httpx.AsyncClient,
    url: str,
    *,
    headers: dict,
    json: dict,
    max_retries: int = 5,
) -> httpx.Response:
    delay = 2.0
    for attempt in range(max_retries + 1):
        resp = await client.post(url, headers=headers, json=json)
        if resp.status_code != 429:
            resp.raise_for_status()
            return resp

        if attempt == max_retries:
            resp.raise_for_status()  # out of retries — raise the 429 for real

        retry_after = resp.headers.get("retry-after")
        wait = float(retry_after) if retry_after else delay
        await asyncio.sleep(wait)
        delay = min(delay * 2, 30)  # exponential backoff, capped at 30s

    raise RuntimeError("unreachable")  # satisfies type checkers