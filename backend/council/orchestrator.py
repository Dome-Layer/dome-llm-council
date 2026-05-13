import asyncio
import json
import logging
from typing import AsyncGenerator

from council.roles import COUNCIL_ROLES, ROUND_2_SUFFIX, VERDICT_SYSTEM, VERDICT_SYSTEM_STRUCTURED
from council.schemas import MemberOutput, VerdictOutput
from council.scoring import parse_confidence, strip_confidence_line
from governance.logger import build_governance_event
from models.request import DeliberationRequest
from models.response import CouncilMemberResponse, VerdictResponse

log = logging.getLogger(__name__)


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

    round1: list[CouncilMemberResponse] = list(
        await asyncio.gather(*[_member_call(mid, prov, base_prompt, 1) for mid, prov in members])
    )

    for r in round1:
        yield _event("member_response", r.model_dump())

    # ── Round 2: sequential ──────────────────────────────────────────────────
    yield _event("status", {"round": 2, "message": "Sequential refinement started"})

    round2: list[CouncilMemberResponse] = []
    for member_id, provider in members:
        peers = _format_peers(member_id, round1)
        prompt_r2 = base_prompt + ROUND_2_SUFFIX.format(peer_responses=peers)
        r2 = await _member_call(member_id, provider, prompt_r2, 2)
        round2.append(r2)
        yield _event("member_response", r2.model_dump())

    # ── Verdict: synthesiser ─────────────────────────────────────────────────
    yield _event("status", {"round": 3, "message": "Synthesising verdict"})

    all_responses = round1 + round2
    verdict_prompt = _build_verdict_prompt(request.question, all_responses)
    verdict = await _verdict_call(request.question, synthesizer, verdict_prompt, all_responses)

    yield _event("verdict", verdict.model_dump(mode="json"))

    # ── Governance event ─────────────────────────────────────────────────────
    gov = build_governance_event(request, all_responses, verdict)
    yield _event("governance_event", gov.model_dump(mode="json"))

    yield _event("done", {})


# ── Member call with structured-output primary, text fallback ────────────────


async def _member_call(
    member_id: str, provider, prompt: str, round_num: int
) -> CouncilMemberResponse:
    role = COUNCIL_ROLES[member_id]
    try:
        data = await provider.generate_structured(prompt, MemberOutput, system=role["system"])
        return CouncilMemberResponse(
            member_id=member_id,
            role=role["name"],
            response=strip_confidence_line(data["reasoning"]),
            confidence=float(data["confidence"]),
            round=round_num,
        )
    except Exception:
        log.warning(
            "structured_output_failed member=%s round=%d — falling back to text parsing",
            member_id,
            round_num,
        )
        text = await provider.generate(prompt, system=role["system"])
        return CouncilMemberResponse(
            member_id=member_id,
            role=role["name"],
            response=strip_confidence_line(text),
            confidence=parse_confidence(text),
            round=round_num,
        )


# ── Verdict call with structured-output primary, text fallback ───────────────


async def _verdict_call(
    question: str,
    synthesizer,
    prompt: str,
    responses: list[CouncilMemberResponse],
) -> VerdictResponse:
    try:
        data = await synthesizer.generate_structured(
            prompt, VerdictOutput, system=VERDICT_SYSTEM_STRUCTURED
        )
        dissenting = (
            []
            if data["dissent"].lower() in ("none", "")
            else [d.strip() for d in data["dissent"].split(",") if d.strip()]
        )
        return VerdictResponse(
            question=question,
            verdict=data["verdict"],
            consensus_confidence=float(data["confidence"]),
            dissenting_views=dissenting,
            recommendation=data["recommendation"],
            member_responses=responses,
        )
    except Exception:
        log.warning("structured_output_failed synthesizer — falling back to text parsing")
        verdict_text = await synthesizer.generate(prompt, system=VERDICT_SYSTEM)
        return _parse_verdict_text(question, verdict_text, responses)


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


def _parse_verdict_text(
    question: str,
    text: str,
    responses: list[CouncilMemberResponse],
) -> VerdictResponse:
    # Text-parsing fallback used only when generate_structured() fails.
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
