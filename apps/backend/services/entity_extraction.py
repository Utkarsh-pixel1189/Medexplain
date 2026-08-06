"""
Phase 6 — Entity extraction & normalization.

Rule-based first pass (regex) for labs, vitals, and dates — cheap, deterministic,
and doesn't require sending PHI to an LLM. An LLM-based pass (extract_entities_llm)
handles report formats the regex doesn't recognize. Both passes go through
_validate, which checks each numeric value against its stated reference range
and flags (but never alters) values that look implausible — for medical data,
guessing a "better fitting" number risks silently replacing a genuinely
correct (if unusual) reading with a wrong one, so we only ever flag for the
user's own review, never auto-correct.
"""
import re
from datetime import datetime

# name  value  unit
LAB_PATTERN = re.compile(
    r"(?P<name>[A-Za-z][A-Za-z0-9 \-/]{2,40}?)\s+"
    r"(?P<value>[0-9]+(?:\.[0-9]+)?)\s*"
    r"(?P<unit>mg/dL|mmol/L|g/dL|%|IU/L|mIU/L|ng/mL|pg/mL|mEq/L|/uL|x10\^9/L|bpm|mmHg)\b",
    re.IGNORECASE,
)

REF_RANGE_PATTERN = re.compile(
    r"\(?\s*(?:ref(?:erence)?\s*range)?\s*[:\(]?\s*"
    r"(?P<low>[0-9]+(?:\.[0-9]+)?)\s*[-–]\s*(?P<high>[0-9]+(?:\.[0-9]+)?)\s*\)?",
    re.IGNORECASE,
)

DATE_PATTERN = re.compile(
    r"\b(?P<date>(?:\d{4}-\d{2}-\d{2})|(?:\d{1,2}/\d{1,2}/\d{2,4}))\b"
)

# Known synonym groups for common lab names; extend as needed.
NAME_NORMALIZATION = {
    "hba1c": "Hemoglobin A1c",
    "hemoglobin a1c": "Hemoglobin A1c",
    "a1c": "Hemoglobin A1c",
    "ldl": "LDL Cholesterol",
    "ldl-c": "LDL Cholesterol",
    "hdl": "HDL Cholesterol",
    "hdl-c": "HDL Cholesterol",
    "tsh": "Thyroid Stimulating Hormone",
    "fbs": "Fasting Blood Sugar",
    "wbc": "White Blood Cell Count",
    "rbc": "Red Blood Cell Count",
}


def normalize_lab_name(name: str) -> str:
    key = name.strip().lower()
    return NAME_NORMALIZATION.get(key, name.strip().title())


def _is_plausible(value: float, low: float, high: float, span: float) -> bool:
    return low - span <= value <= high + span


def _validate(value: float, ref_range: str | None) -> bool:
    """Checks whether a value falls within a generous margin of its stated
    reference range. Returns True if it looks worth a second look, False if
    it looks fine. This never modifies the extracted value — for medical
    data, guessing a "better fitting" number risks replacing a genuinely
    correct (if unusual) reading with a wrong one, so we only flag, never
    silently rewrite."""
    if not ref_range:
        return False

    match = re.match(r"(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)", ref_range)
    if not match:
        return False

    low, high = float(match.group(1)), float(match.group(2))
    span = high - low or 1

    return not _is_plausible(value, low, high, span)


def extract_labs(text: str) -> list[dict]:
    results = []
    for m in LAB_PATTERN.finditer(text):
        name = normalize_lab_name(m.group("name"))
        value = float(m.group("value"))
        unit = m.group("unit")

        # look for a reference range shortly after the match
        window = text[m.end(): m.end() + 120]
        ref_match = REF_RANGE_PATTERN.search(window)
        ref_range = f"{ref_match.group('low')}-{ref_match.group('high')}" if ref_match else None

        flagged = _validate(value, ref_range)

        results.append({
            "type": "lab",
            "name": name,
            "value": str(value),
            "numeric_value": value,
            "unit": unit,
            "ref_range": ref_range,
            "date": None,
            "flagged": flagged,
            "original_value": None,
        })
    return results


def extract_dates(text: str) -> list[datetime]:
    dates = []
    for m in DATE_PATTERN.finditer(text):
        raw = m.group("date")
        for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y"):
            try:
                dates.append(datetime.strptime(raw, fmt))
                break
            except ValueError:
                continue
    return dates


def extract_entities(parsed: dict) -> list[dict]:
    """Top-level entry point used by the ingest pipeline for the regex pass."""
    text = parsed["full_text"]
    entities = extract_labs(text)

    dates = extract_dates(text)
    if dates:
        # naive heuristic: attach the earliest date found in the document to
        # every lab that doesn't already have one. Replace with per-line
        # proximity matching once you have real report samples to test against.
        for e in entities:
            if e["date"] is None:
                e["date"] = dates[0].isoformat()

    return entities


async def extract_entities_llm(text: str) -> list[dict]:
    """LLM-based extraction fallback/upgrade over the regex extractor above.
    Handles report formats the regex patterns don't recognize (e.g. ECG
    interpretation reports, imaging reports) by asking Mistral to pull out
    every measurable clinical value as structured JSON.
    """
    import json
    import httpx
    from core.config import get_settings

    settings = get_settings()
    if not settings.MISTRAL_API_KEY:
        return []

    system_prompt = (
        "Extract every measurable clinical value, vital sign, or lab result from the "
        "report text below. This text may come from a multi-column table (e.g. "
        "INVESTIGATION / RESULT / UNITS / REFERENCE RANGE) where OCR has sometimes "
        "broken the columns apart or reordered them — use your judgment to reconnect "
        "each value with its correct unit and reference range even if they don't "
        "appear on the same line. Every row in a lab table almost always has a "
        "reference range somewhere in the source — look carefully before concluding "
        "one isn't stated. Respond with ONLY a valid JSON array (no markdown, no "
        "explanation, no code fences) of objects with exactly these fields: "
        '"type" (one of "lab", "vital", "medication", "diagnosis"), "name" (string), '
        '"value" (string), "unit" (string or null), "ref_range" (string in the exact '
        'form "low-high", or null only if truly absent from the source), '
        '"date" (ISO 8601 date string or null). '
        "Only include items with an actual numeric or clearly stated value — skip "
        "narrative text with no measurable value. If nothing qualifies, return []."
    )
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            resp = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.MISTRAL_API_KEY}"},
                json={
                    "model": settings.MISTRAL_CHAT_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text[:12000]},  # cap input size
                    ],
                    "temperature": 0.0,
                },
            )
            resp.raise_for_status()
            raw = resp.json()["choices"][0]["message"]["content"].strip()
        except Exception:
            return []

    # Defensive parsing: strip stray markdown fences if the model adds them
    # despite instructions, and bail out cleanly on malformed JSON.
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
        if not isinstance(item, dict) or "name" not in item:
            continue
        raw_value = item.get("value")
        numeric_value = None
        if raw_value is not None:
            try:
                numeric_value = float(str(raw_value).strip())
            except ValueError:
                numeric_value = None

        ref_range = item.get("ref_range")
        flagged = _validate(numeric_value, ref_range) if numeric_value is not None else False

        results.append({
            "type": item.get("type") or "lab",
            "name": str(item.get("name", "")).strip()[:200],
            "value": str(numeric_value) if numeric_value is not None else (str(raw_value) if raw_value is not None else None),
            "numeric_value": numeric_value,
            "unit": item.get("unit"),
            "ref_range": ref_range,
            "date": item.get("date"),
            "flagged": flagged,
            "original_value": None,
        })
    return results