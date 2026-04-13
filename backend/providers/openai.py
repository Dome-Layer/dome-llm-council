from typing import Optional

from openai import AsyncOpenAI

from .base import LLMProvider


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o") -> None:
        self._client = AsyncOpenAI(api_key=api_key)
        self._model = model

    async def generate(self, prompt: str, system: Optional[str] = None) -> str:
        messages: list[dict] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        resp = await self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            max_tokens=2048,
        )
        return resp.choices[0].message.content or ""
