"""House style: no em or en dashes in the backend or in what the council writes.

The source scan keeps the dashes out of prompts and schema descriptions (they
nudge the models into writing them) and out of the governance rule text users
read. The orchestrator tests pin down the post-processing applied to member
responses and the verdict before they are streamed to the user.
"""

import asyncio
from pathlib import Path

import pytest

from council import orchestrator
from council.house_style import strip_dashes
from council.roles import COUNCIL_ROLES, VERDICT_SYSTEM, VERDICT_SYSTEM_STRUCTURED

EM = "\N{EM DASH}"
EN = "\N{EN DASH}"

BACKEND = Path(__file__).resolve().parents[1]
SKIPPED_DIRS = {".venv", "tests", "__pycache__"}
SCANNED_FILES = sorted(
    path
    for path in BACKEND.rglob("*.py")
    if not SKIPPED_DIRS.intersection(path.relative_to(BACKEND).parts)
)


def test_no_dashes_in_backend_source():
    offenders = [
        f"{path.relative_to(BACKEND)}:{number}"
        for path in SCANNED_FILES
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1)
        if EM in line or EN in line
    ]
    assert not offenders, "Em or en dash found (house style):\n" + "\n".join(offenders)


@pytest.mark.parametrize(
    "system",
    [
        *(role["system"] for role in COUNCIL_ROLES.values()),
        VERDICT_SYSTEM,
        VERDICT_SYSTEM_STRUCTURED,
    ],
)
def test_every_system_prompt_asks_for_no_dashes(system):
    assert "Never use the em dash or the en dash" in system


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        (f"Adopt it {EM} but phase it in", "Adopt it, but phase it in"),
        (f"risk{EM}reward", "risk, reward"),
        (f"within 6{EN}12 months", "within 6-12 months"),
        (f"one {EN} two", "one, two"),
        (f"{EM} first\n{EM} second", "- first\n- second"),
        (f"trailing {EM}", "trailing"),
        (EM, "N/A"),
        ("plain text, untouched", "plain text, untouched"),
        (f"(`a`, ...) {EM} then", "(`a`, ...), then"),
    ],
)
def test_strip_dashes(raw, expected):
    assert strip_dashes(raw) == expected


class _FakeProvider:
    def __init__(self, structured: dict):
        self._structured = structured

    async def generate_structured(self, prompt, schema, system=None):
        return self._structured

    async def generate(self, prompt, system=None):
        raise AssertionError("text fallback not expected")


def test_member_response_is_cleaned():
    provider = _FakeProvider({"reasoning": f"Proceed {EM} carefully.", "confidence": 0.8})
    result = asyncio.run(orchestrator._member_call("claude", provider, "q", 1))
    assert result.response == "Proceed, carefully."


def test_verdict_is_cleaned_and_dissent_keeps_its_split():
    synthesizer = _FakeProvider(
        {
            "verdict": f"Approve {EM} with conditions.",
            "reasoning": "unused",
            "dissent": f"cost {EM} high upfront, timing",
            "recommendation": f"Pilot for 3{EN}6 months.",
            "confidence": 0.7,
        }
    )
    verdict = asyncio.run(orchestrator._verdict_call("q", synthesizer, "prompt", []))
    assert verdict.verdict == "Approve, with conditions."
    assert verdict.dissenting_views == ["cost, high upfront", "timing"]
    assert verdict.recommendation == "Pilot for 3-6 months."
