"""
Phase 6 — Entity extraction & normalization.

Rule-based first pass (regex) for labs, vitals, and dates — cheap, deterministic,
and doesn't require sending PHI to an LLM. An LLM-based pass (extract_entities_llm)
handles report formats the regex doesn't recognize. Both passes go through
_validate_and_correct, which checks each numeric value against its stated
reference range and corrects (or flags) values that show the fingerprint of a
common OCR error — since this is medical data, we never silently guess when
there's genuine ambiguity.
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


def _validate_and_correct(value: float, ref_range: str | None) -> tuple[float, bool, str | None]:
    """Checks a value against its reference range and, if implausible, tries
    a set of known OCR failure patterns. Returns (final_value, flagged,
    original_value_if_corrected).

    - If the value is already plausible: returned unchanged, not flagged.
    - If exactly one correction candidate becomes plausible: auto-corrected,
      original value preserved for transparency.
    - If zero or multiple candidates are plausible: the raw value is kept
      as-is but flagged as unverified — we never silently guess when there's
      real ambiguity, since this is medical data.
    """
    if not ref_range:
        return value, False, None

    match = re.match(r"(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)", ref_range)
    if not match:
        return value, False, None

    low, high = float(match.group(1)), float(match.group(2))
    span = high - low or 1

    if _is_plausible(value, low, high, span):
        return value, False, None

    value_str = str(value)
    int_part, _, dec_part = value_str.partition(".")
    digits_only = int_part + dec_part
    candidates: set[float] = set()

    # Prepended stray digit: 214.5 -> 14.5
    if len(int_part) > 1:
        try:
            candidates.add(float(f"{int_part[1:]}.{dec_part}" if dec_part else int_part[1:]))
        except ValueError:
            pass

    # Appended stray digit: 14.55 -> 14.5
    if len(dec_part) > 1:
        try:
            candidates.add(float(f"{int_part}.{dec_part[:-1]}"))
        except ValueError:
            pass
    elif len(int_part) > 2:
        try:
            candidates.add(float(int_part[:-1]))
        except ValueError:
            pass

    # Missing decimal point: 145 -> 14.5 (try inserting one place from the right)
    if len(digits_only) >= 2:
        try:
            candidates.add(float(f"{digits_only[:-1]}.{digits_only[-1]}"))
        except ValueError:
            pass

    # Misplaced decimal (shifted one place): 1.45 -> 14.5, 145.0 -> 14.5
    try:
        candidates.add(value * 10)
        candidates.add(value / 10)
    except (ValueError, ZeroDivisionError):
        pass

    # Adjacent-digit transposition in the integer part: 41.5 -> 14.5
    if len(int_part) == 2:
        try:
            candidates.add(float(f"{int_part[::-1]}.{dec_part}" if dec_part else int_part[::-1]))
        except ValueError:
            pass

    candidates.discard(value)
    plausible = [c for c in candidates if _is_plausible(c, low, high, span)]

    if len(plausible) == 1:
        return plausible[0], True, value_str

    # Zero or multiple plausible candidates — genuine ambiguity, don't guess.
    return value, True, None


def extract_labs(text: str) -> list[dict]:
    results = []
    for m in LAB_PATTERN.finditer(text):
        name = normalize_lab_name(m.group("name"))
        value = float(m.group("value"))
        unit = m.group("unit")

        # look for a reference range shortly after the match
        window = text[m.end(): m.end() + 40]
        ref_match = REF_RANGE_PATTERN.search(window)
        ref_range = f"{ref_match.group('low')}-{ref_match.group('high')}" if ref_match else None

        final_value, flagged, original = _validate_and_correct(value, ref_range)

        results.append({
            "type": "lab",
            "name": name,
            "value": str(final_value),
            "numeric_value": final_value,
            "unit": unit,
            "ref_range": ref_range,
            "date": None,
            "flagged": flagged,
            "original_value": original,
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
        "report text below. Respond with ONLY a valid JSON array (no markdown, no "
        "explanation, no code fences) of objects with exactly these fields: "
        '"type" (one of "lab", "vital", "medication", "diagnosis"), "name" (string), '
        '"value" (string), "unit" (string or null), "ref_range" (string or null), '
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
        flagged, original = False, None
        if numeric_value is not None:
            numeric_value, flagged, original = _validate_and_correct(numeric_value, ref_range)

        results.append({
            "type": item.get("type") or "lab",
            "name": str(item.get("name", "")).strip()[:200],
            "value": str(numeric_value) if numeric_value is not None else (str(raw_value) if raw_value is not None else None),
            "numeric_value": numeric_value,
            "unit": item.get("unit"),
            "ref_range": ref_range,
            "date": item.get("date"),
            "flagged": flagged,
            "original_value": original,
        })
    return results