"""
Generates an at-a-glance summary for a parsed report: a short overview,
per-value status (normal/low/high), and general, non-prescriptive
suggestions. Mirrors the safety posture of the QA system prompt — never
diagnoses, never recommends medications or dosages, always defers to a
physician for anything uncertain.
"""
import json
import httpx

from core.config import get_settings

SYSTEM_PROMPT = (
    "You summarize a patient's medical report for their own understanding. "
    "Respond with ONLY a valid JSON object (no markdown, no explanation) with these fields: "
    '"overview" (1-2 plain-language sentences on overall status, non-diagnostic), '
    '"insights" (array of objects with "name", "value", "unit", "status" where status is '
    'one of "normal", "low", "high", "unclear" — only classify a value if the report text or '
    'a stated reference range supports it, otherwise use "unclear"), '
    '"suggestions" (array of up to 4 short, general, non-prescriptive lifestyle notes — never '
    "medication names, dosages, or diagnoses — each framed as general information, not an "
    "instruction, and encouraging follow-up with a physician where relevant). "
    "Never diagnose. If the report is too limited to summarize meaningfully, return "
    '{"overview": "...", "insights": [], "suggestions": []} explaining that in the overview.'
)


async def generate_summary(full_text: str, entities: list[dict]) -> dict | None:
    settings = get_settings()
    if not settings.MISTRAL_API_KEY:
        return None

    entities_context = "\n".join(
        f"- {e['name']}: {e.get('value')} {e.get('unit') or ''} (ref range: {e.get('ref_range') or 'not stated'})"
        for e in entities
    ) or "(no structured values extracted)"

    user_content = (
        f"Report text (may be partial):\n{full_text[:8000]}\n\n"
        f"Extracted values:\n{entities_context}"
    )

    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.MISTRAL_API_KEY}"},
                json={
                    "model": settings.MISTRAL_CHAT_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_content},
                    ],
                    "temperature": 0.2,
                },
            )
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            return None

    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:].strip()

    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return None
    if not isinstance(data, dict):
        return None

    valid_statuses = ("normal", "low", "high", "unclear")
    return {
        "overview": str(data.get("overview", ""))[:1000],
        "insights": [
            {
                "name": str(i.get("name", ""))[:200],
                "value": str(i.get("value")) if i.get("value") is not None else None,
                "unit": i.get("unit"),
                "status": i.get("status") if i.get("status") in valid_statuses else "unclear",
            }
            for i in data.get("insights", []) if isinstance(i, dict)
        ][:12],
        "suggestions": [str(s)[:300] for s in data.get("suggestions", []) if isinstance(s, str)][:4],
    }