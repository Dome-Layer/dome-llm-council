from typing import Literal, Optional

from pydantic import BaseModel, Field

# The site's four languages (roadmap row 6): the panel writes in the one the visitor reads.
OutputLanguage = Literal["en", "it", "nl", "de"]


class DeliberationRequest(BaseModel):
    question: str = Field(..., min_length=10, max_length=2000)
    context: Optional[str] = Field(None, max_length=4000)
    user_id: Optional[str] = None
    # Absent from Agent Flow's calls, so P5 keeps its English verdicts.
    output_language: OutputLanguage = "en"
