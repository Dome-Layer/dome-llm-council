from dome_core.governance import GovernanceEvent
from pydantic import BaseModel

__all__ = ["CouncilMemberResponse", "VerdictResponse", "GovernanceEvent"]


class CouncilMemberResponse(BaseModel):
    member_id: str
    role: str
    response: str
    confidence: float
    round: int


class VerdictResponse(BaseModel):
    question: str
    verdict: str
    consensus_confidence: float
    dissenting_views: list[str]
    recommendation: str
    member_responses: list[CouncilMemberResponse]
