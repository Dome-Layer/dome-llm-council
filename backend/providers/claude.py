from typing import Optional

import anthropic
from pydantic import BaseModel

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

    async def generate_structured(
        self, prompt: str, schema: type[BaseModel], system: Optional[str] = None
    ) -> dict:
        tool_name = schema.__name__
        js = schema.model_json_schema()
        input_schema = {
            "type": "object",
            "properties": js.get("properties", {}),
            "required": js.get("required", []),
        }
        kwargs: dict = {
            "model": self._model,
            "max_tokens": 2048,
            "tools": [
                {
                    "name": tool_name,
                    "description": js.get("description", tool_name),
                    "input_schema": input_schema,
                }
            ],
            "tool_choice": {"type": "tool", "name": tool_name},
            "messages": [{"role": "user", "content": prompt}],
        }
        if system:
            kwargs["system"] = system
        msg = await self._client.messages.create(**kwargs)
        for block in msg.content:
            if block.type == "tool_use" and block.name == tool_name:
                return block.input  # type: ignore[union-attr]
        raise ValueError(f"No tool_use block in Claude response for schema {tool_name}")
