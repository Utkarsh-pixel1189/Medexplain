"""
Generates an at-a-glance summary for a parsed report: a short overview,
per-value status (normal/low/high), and general, non-prescriptive
suggestions.

Status classification (normal/low/high) is computed deterministically in
Python from each entity's stated reference range — not left to the LLM's
judgment — since asking a language model to do numeric range comparison is
an easy place for it to get inconsistent. The LLM is only used for the
overview and suggestions text, which is what it's actually good at.
"""
import json
import re
import httpx

from core.config import get_settings

SYSTEM_PROMPT = (
    "You write a short, plain-language summary for a patient's medical report. "
    "You will be given each extracted value along with its computed status "
    "(normal, low, or high) relative to its stated reference range — trust "
    "that status as already correct, don't re-derive it yourself. "
    "Respond with ONLY a valid JSON object (no markdown, no explanation) with these fields: "
    '"overview" (1-2 plain-language sentences focused on whatever is NOT normal, if '
    "anything — name the specific value(s) involved rather than speaking generically), "
    '"suggestions" (array of up to 4 short, general, non-prescriptive notes — each one '
    "tied to a SPECIFIC value that came back low or high, explaining in plain language "
    "what that kind of value relates to and a general, non-prescriptive angle on it "
    "(e.g. diet, activity, hydration, sleep — never medication names, dosages, or "
    "supplement dosing). If every value is normal, suggestions can be general "
    "preventive/wellness notes instead, but still avoid being generic filler — make them "
    "relevant to the specific type of test this report is (e.g. blood count vs. thyroid "
    "vs. lipid panel) rather than one-size-fits-all advice. "
    "Never diagnose or suggest what condition something 'might indicate'. If the report "
    'is too limited to summarize meaningfully, return {"overview": "...", "suggestions": []} '
    "explaining that in the overview."
)


def _classify_status(value: float, ref_range: str | None) -> str:
    """Deterministic normal/low/high/unclear classification from the stated
    reference range — plain arithmetic, not left to the LLM to judge."""
    if ref_range is None:
        return "unclear"

    match = re.match(r"(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)", ref_range)
    if not match:
        return "unclear"

    low, high = float(match.group(1)), float(match.group(2))
    if value < low:
        return "low"
    if value > high:
        return "high"
    return "normal"


def _build_insights(entities: list[dict]) -> list[dict]:
    insights = []
    for e in entities:
        if e.get("type") != "lab" or e.get("numeric_value") is None:
            continue
        insights.append({
            "name": e["name"],
            "value": e.get("value"),
            "unit": e.get("unit"),
            "status": _classify_status(e["numeric_value"], e.get("ref_range")),
        })
    return insights[:12]


async def generate_summary(full_text: str, entities: list[dict]) -> dict | None:
    settings = get_settings()
    insights = _build_insights(entities)

    if not settings.MISTRAL_API_KEY:
        # Still return the deterministic insights even without narrative text.
        return {"overview": "", "insights": insights, "suggestions": []}

    entities_context = "\n".join(
        f"- {e['name']}: {e.get('value')} {e.get('unit') or ''} "
        f"(ref range: {e.get('ref_range') or 'not stated'}, status: "
        f"{_classify_status(e['numeric_value'], e.get('ref_range')) if e.get('numeric_value') is not None else 'unclear'})"
        for e in entities if e.get("type") == "lab"
    ) or "(no structured values extracted)"

    user_content = (
        f"Report text (may be partial):\n{full_text[:8000]}\n\n"
        f"Extracted values with their computed status:\n{entities_context}"
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
            return {"overview": "", "insights": insights, "suggestions": []}

    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:].strip()

    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        data = {}
    if not isinstance(data, dict):
        data = {}

    return {
        "overview": str(data.get("overview", ""))[:1000],
        "insights": insights,  # always the deterministic version, never LLM-judged
        "suggestions": [str(s)[:300] for s in data.get("suggestions", []) if isinstance(s, str)][:4],
    }