import asyncio
import json
from typing import AsyncGenerator

from council.roles import COUNCIL_ROLES, ROUND_2_SUFFIX, VERDICT_SYSTEM
from council.scoring import parse_confidence, strip_confidence_line
from governance.logger import build_governance_event
from models.request import DeliberationRequest
from models.response import CouncilMemberResponse, VerdictResponse


async def run_deliberation(
    request: DeliberationRequest,
    claude,
    gemini,
    openai,
    synthesizer,
) -> AsyncGenerator[str, None]:
    base_prompt = request.question
    if request.context:
        base_prompt = f"Context:\n{request.context}\n\nQuestion: {request.question}"

    members = [
        ("claude", claude),
        ("gemini", gemini),
        ("openai", openai),
    ]

    # ── Round 1: parallel ────────────────────────────────────────────────────
    yield _event("status", {"round": 1, "message": "Parallel deliberation started"})

    async def _call(member_id: str, provider) -> CouncilMemberResponse:
        role = COUNCIL_ROLES[member_id]
        text = await provider.generate(base_prompt, system=role["system"])
        return CouncilMemberResponse(
            member_id=member_id,
            role=role["name"],
            response=strip_confidence_line(text),
            confidence=parse_confidence(text),
            round=1,
        )

    round1: list[CouncilMemberResponse] = list(
        await asyncio.gather(*[_call(mid, prov) for mid, prov in members])
    )

    for r in round1:
        yield _event("member_response", r.model_dump())

    # ── Round 2: sequential ──────────────────────────────────────────────────
    yield _event("status", {"round": 2, "message": "Sequential refinement started"})

    round2: list[CouncilMemberResponse] = []
    for member_id, provider in members:
        role = COUNCIL_ROLES[member_id]
        peers = _format_peers(member_id, round1)
        prompt_r2 = base_prompt + ROUND_2_SUFFIX.format(peer_responses=peers)
        text = await provider.generate(prompt_r2, system=role["system"])
        r2 = CouncilMemberResponse(
            member_id=member_id,
            role=role["name"],
            response=strip_confidence_line(text),
            confidence=parse_confidence(text),
            round=2,
        )
        round2.append(r2)
        yield _event("member_response", r2.model_dump())

    # ── Verdict: synthesiser ─────────────────────────────────────────────────
    yield _event("status", {"round": 3, "message": "Synthesising verdict"})

    all_responses = round1 + round2
    verdict_prompt = _build_verdict_prompt(request.question, all_responses)
    verdict_text = await synthesizer.generate(verdict_prompt, system=VERDICT_SYSTEM)
    verdict = _parse_verdict(request.question, verdict_text, all_responses)

    yield _event("verdict", verdict.model_dump(mode="json"))

    # ── Governance event ─────────────────────────────────────────────────────
    gov = build_governance_event(request, all_responses, verdict)
    yield _event("governance_event", gov.model_dump(mode="json"))

    yield _event("done", {})


# ── Helpers ──────────────────────────────────────────────────────────────────


def _event(event_type: str, data: dict) -> str:
    return json.dumps({"type": event_type, **data}, default=str)


def _format_peers(exclude_id: str, responses: list[CouncilMemberResponse]) -> str:
    parts = [
        f"**{r.role} ({r.member_id})**:\n{r.response}"
        for r in responses
        if r.member_id != exclude_id
    ]
    return "\n\n".join(parts)


def _build_verdict_prompt(question: str, responses: list[CouncilMemberResponse]) -> str:
    lines = [f"Question: {question}\n"]
    for r in responses:
        lines.append(f"[Round {r.round}] {r.role}: {r.response}\n(confidence: {r.confidence:.2f})")
    return "\n\n".join(lines)


def _parse_verdict(
    question: str,
    text: str,
    responses: list[CouncilMemberResponse],
) -> VerdictResponse:
    keys = ("VERDICT", "REASONING", "DISSENT", "RECOMMENDATION")
    parsed: dict[str, str] = {k: "" for k in keys}

    for line in text.splitlines():
        for key in keys:
            if line.startswith(f"{key}:"):
                parsed[key] = line[len(key) + 1 :].strip()

    dissenting = (
        []
        if parsed["DISSENT"].lower() in ("none", "")
        else [d.strip() for d in parsed["DISSENT"].split(",") if d.strip()]
    )

    return VerdictResponse(
        question=question,
        verdict=parsed["VERDICT"] or text[:200],
        consensus_confidence=parse_confidence(text),
        dissenting_views=dissenting,
        recommendation=parsed["RECOMMENDATION"],
        member_responses=responses,
    )
