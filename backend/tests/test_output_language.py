"""Output language (roadmap row 6): the panel and the verdict follow the visitor's language."""

import asyncio
import json

import pytest
from pydantic import ValidationError

from council.orchestrator import run_deliberation
from council.schemas import VerdictOutput
from models.request import DeliberationRequest


class _FakeProvider:
    def __init__(self) -> None:
        self.prompts: list[str] = []

    async def generate_structured(self, prompt, schema, system=None):
        self.prompts.append(prompt)
        if schema is VerdictOutput:
            return {
                "verdict": "Proceed.",
                "dissent": "None",
                "recommendation": "Pilot first.",
                "confidence": 0.8,
            }
        return {"reasoning": "A view.", "confidence": 0.7}

    async def generate(self, prompt, system=None):  # pragma: no cover, structured path only
        self.prompts.append(prompt)
        return "A view.\nConfidence: 0.70"


def _run(request: DeliberationRequest):
    claude, gemini, openai, synth = (_FakeProvider() for _ in range(4))

    async def collect():
        return [
            json.loads(e) async for e in run_deliberation(request, claude, gemini, openai, synth)
        ]

    events = asyncio.run(collect())
    return events, [claude, gemini, openai], synth


QUESTION = "Should we move invoice approval into the ERP this year?"


def test_english_is_the_default_and_sends_the_prompts_unchanged():
    request = DeliberationRequest(question=QUESTION)
    assert request.output_language == "en"
    events, members, synth = _run(request)
    for prompt in [p for m in members for p in m.prompts] + synth.prompts:
        assert "OUTPUT LANGUAGE" not in prompt
    gov = next(e for e in events if e["type"] == "governance_event")
    assert gov["metadata"]["output_language"] == "en"


def test_other_language_reaches_both_rounds_and_the_verdict():
    events, members, synth = _run(DeliberationRequest(question=QUESTION, output_language="de"))
    for member in members:
        assert len(member.prompts) == 2
        for prompt in member.prompts:
            assert "OUTPUT LANGUAGE: write your whole answer in German" in prompt
            assert "'Confidence: X.XX'" in prompt
    assert "OUTPUT LANGUAGE: write your whole answer in German" in synth.prompts[0]
    assert "never spelled out in plain ASCII" in synth.prompts[0]
    gov = next(e for e in events if e["type"] == "governance_event")
    assert gov["metadata"]["output_language"] == "de"


def test_unsupported_output_language_is_rejected():
    with pytest.raises(ValidationError):
        DeliberationRequest(question=QUESTION, output_language="fr")
