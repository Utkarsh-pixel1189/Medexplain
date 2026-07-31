"""
Maps a report's extracted findings to body systems for the organ-highlight
visualization. One LLM call per report — reuses the same entities already
extracted, just asks for a system-level grouping rather than a new pass over
the raw text.
"""
import json
import httpx

from core.config import get_settings

VALID_SYSTEMS = [
    "heart", "lungs", "liver", "kidneys", "blood", "immune",
    "digestive", "thyroid", "bones", "brain_nervous", "reproductive", "skin",
]

SYSTEM_PROMPT = (
    "You map medical report findings to body systems for a visual body diagram. "
    "Respond with ONLY a valid JSON array (no markdown, no explanation) of objects "
    'with fields "system" (one of: ' + ", ".join(VALID_SYSTEMS) + '), '
    '"status" ("normal", "attention", or "unclear"), and "reason" (a short plain-'
    "language phrase, e.g. 'red blood cell count is on the lower side'). "
    "Only include a system if the report actually contains a finding relevant to it — "
    "do not include systems with no supporting data. Base status on whether the "
    "findings for that system were flagged as low/high vs. normal. If nothing in the "
    "report maps clearly to any system, return []."
)


async def map_to_organs(entities: list[dict]) -> list[dict]:
    settings = get_settings()
    if not settings.MISTRAL_API_KEY or not entities:
        return []

    context = "\n".join(
        f"- {e['name']}: {e.get('value')} {e.get('unit') or ''} "
        f"(ref range: {e.get('ref_range') or 'not stated'})"
        for e in entities if e.get("type") == "lab"
    )
    if not context:
        return []

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.MISTRAL_API_KEY}"},
                json={
                    "model": settings.MISTRAL_CHAT_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": context},
                    ],
                    "temperature": 0.1,
                },
            )
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            return []

    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:].strip()

    try:
        items = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return []
    if not isinstance(items, list):
        return []

    results = []
    for item in items:
        if not isinstance(item, dict):
            continue
        system = item.get("system")
        status = item.get("status")
        if system not in VALID_SYSTEMS or status not in ("normal", "attention", "unclear"):
            continue
        results.append({
            "system": system,
            "status": status,
            "reason": str(item.get("reason", ""))[:200],
        })
    return results