from datetime import datetime
from typing import Optional

from pydantic import BaseModel


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


class GovernanceEvent(BaseModel):
    agent_id: str
    action_type: str
    timestamp: datetime
    input_hash: str
    input_type: str
    output_summary: str
    rules_applied: list[str]
    rules_triggered: list[str]
    confidence: Optional[float]
    human_in_loop: str
    user_id: Optional[str]
    workflow_run_id: Optional[str] = None
    metadata: dict
