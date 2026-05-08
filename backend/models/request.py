from typing import Optional

from pydantic import BaseModel, Field


class DeliberationRequest(BaseModel):
    question: str = Field(..., min_length=10, max_length=2000)
    context: Optional[str] = Field(None, max_length=4000)
    user_id: Optional[str] = None
