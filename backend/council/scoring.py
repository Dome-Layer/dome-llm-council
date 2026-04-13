import re

_PATTERN = re.compile(
    r"confidence(?:\s+score)?[:\s]+([0-9]+(?:\.[0-9]+)?)\s*%?",
    re.IGNORECASE,
)


def parse_confidence(text: str) -> float:
    """Extract confidence score from response text. Returns 0.5 if not found."""
    match = _PATTERN.search(text)
    if not match:
        return 0.5
    raw = float(match.group(1))
    if raw > 1.0:  # percentage format (e.g. 85 → 0.85)
        raw /= 100.0
    return round(max(0.0, min(1.0, raw)), 2)


def strip_confidence_line(text: str) -> str:
    """Remove the trailing confidence line from response text."""
    lines = text.strip().splitlines()
    if lines and re.search(r"^confidence", lines[-1], re.IGNORECASE):
        lines = lines[:-1]
    return "\n".join(lines).strip()
