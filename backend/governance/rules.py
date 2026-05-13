from dataclasses import dataclass


@dataclass(frozen=True)
class CouncilRule:
    id: str
    name: str
    description: str
    always_applied: bool
    trigger_condition: str | None = None


RULES: dict[str, CouncilRule] = {
    "R-COUNCIL-01": CouncilRule(
        id="R-COUNCIL-01",
        name="Multi-model quorum enforced",
        description=(
            "At least two independent LLM providers (Strategic Advisor, Research Analyst, "
            "Critical Advisor) participated in Round 1 of the deliberation."
        ),
        always_applied=True,
    ),
    "R-COUNCIL-02": CouncilRule(
        id="R-COUNCIL-02",
        name="Cross-examination round completed",
        description=(
            "Each council member reviewed all peer Round 1 responses and produced a "
            "refined position in Round 2."
        ),
        always_applied=True,
    ),
    "R-COUNCIL-03": CouncilRule(
        id="R-COUNCIL-03",
        name="Independent synthesizer verdict issued",
        description=(
            "A dedicated synthesizer model — separate from the three council members — "
            "produced the final verdict, reasoning, dissent, and recommendation."
        ),
        always_applied=True,
    ),
    "R-COUNCIL-LOW-CONFIDENCE": CouncilRule(
        id="R-COUNCIL-LOW-CONFIDENCE",
        name="Low consensus confidence",
        description=(
            "The synthesizer's consensus_confidence fell below 0.65, indicating "
            "meaningful disagreement or uncertainty across council members."
        ),
        always_applied=False,
        trigger_condition="consensus_confidence < 0.65",
    ),
}

ALWAYS_APPLIED_IDS: list[str] = [r.id for r in RULES.values() if r.always_applied]
