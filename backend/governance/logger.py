import hashlib
from datetime import datetime, timezone

from models.request import DeliberationRequest
from models.response import CouncilMemberResponse, GovernanceEvent, VerdictResponse

_RULES = ["R-COUNCIL-01", "R-COUNCIL-02", "R-COUNCIL-03"]
_LOW_CONFIDENCE_THRESHOLD = 0.65


def build_governance_event(
    request: DeliberationRequest,
    responses: list[CouncilMemberResponse],
    verdict: VerdictResponse,
) -> GovernanceEvent:
    raw = (request.question + (request.context or "")).encode()
    input_hash = hashlib.sha256(raw).hexdigest()

    triggered = (
        ["R-COUNCIL-LOW-CONFIDENCE"] if verdict.consensus_confidence < _LOW_CONFIDENCE_THRESHOLD else []
    )
    human_in_loop = "recommended" if triggered else "not_required"

    r1 = [r for r in responses if r.round == 1]
    avg_r1_confidence = sum(r.confidence for r in r1) / len(r1) if r1 else 0.0

    return GovernanceEvent(
        agent_id="dome-llm-council",
        action_type="deliberation",
        timestamp=datetime.now(timezone.utc),
        input_hash=input_hash,
        input_type="text",
        output_summary=f"Council verdict: {request.question[:80]}",
        rules_applied=_RULES,
        rules_triggered=triggered,
        confidence=verdict.consensus_confidence,
        human_in_loop=human_in_loop,
        user_id=request.user_id,
        metadata={
            "member_count": len({r.member_id for r in responses}),
            "round_count": 2,
            "avg_round1_confidence": round(avg_r1_confidence, 2),
            "verdict_confidence": verdict.consensus_confidence,
            "dissenting_views_count": len(verdict.dissenting_views),
        },
    )
