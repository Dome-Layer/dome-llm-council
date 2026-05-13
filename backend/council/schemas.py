from pydantic import BaseModel, Field


class MemberOutput(BaseModel):
    reasoning: str = Field(description="Full reasoning text for this response")
    confidence: float = Field(description="Confidence in this position, 0.0–1.0", ge=0.0, le=1.0)


class VerdictOutput(BaseModel):
    verdict: str = Field(description="One clear sentence verdict")
    reasoning: str = Field(description="2–3 sentences of synthesised reasoning")
    dissent: str = Field(description="Comma-separated key dissenting points, or 'None'")
    recommendation: str = Field(description="One actionable sentence")
    confidence: float = Field(description="Consensus confidence, 0.0–1.0", ge=0.0, le=1.0)
