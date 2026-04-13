from typing import Optional

import anthropic

from .base import LLMProvider


class ClaudeProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6") -> None:
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._model = model

    async def generate(self, prompt: str, system: Optional[str] = None) -> str:
        kwargs: dict = {
            "model": self._model,
            "max_tokens": 2048,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            kwargs["system"] = system
        msg = await self._client.messages.create(**kwargs)
        return msg.content[0].text  # type: ignore[union-attr]
