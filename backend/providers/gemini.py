import asyncio
import logging
from typing import Optional

from google import genai
from google.genai import types
from google.genai.errors import ServerError

from .base import LLMProvider

logger = logging.getLogger(__name__)

_TIMEOUT_MS  = 60_000
_MAX_RETRIES = 3
_BASE_DELAY  = 2.0   # seconds; doubles on each attempt
_FALLBACK_MODEL = "gemini-2.5-flash-lite"


class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gemini-2.5-flash") -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model

    async def generate(self, prompt: str, system: Optional[str] = None) -> str:
        for model in (self._model, _FALLBACK_MODEL):
            try:
                return await self._generate_with_retry(prompt, system, model)
            except ServerError:
                if model == _FALLBACK_MODEL:
                    raise
                logger.warning("Gemini primary model %s unavailable — trying fallback %s", model, _FALLBACK_MODEL)

        raise RuntimeError("All Gemini models unavailable")  # unreachable, satisfies type checker

    async def _generate_with_retry(self, prompt: str, system: Optional[str], model: str) -> str:
        config = types.GenerateContentConfig(
            system_instruction=system,
            http_options=types.HttpOptions(timeout=_TIMEOUT_MS),
        )
        delay = _BASE_DELAY
        for attempt in range(_MAX_RETRIES):
            try:
                response = await self._client.aio.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
                return response.text or ""
            except ServerError as exc:
                if attempt < _MAX_RETRIES - 1:
                    logger.warning(
                        "Gemini %s — attempt %d/%d failed, retrying in %.0fs: %s",
                        model, attempt + 1, _MAX_RETRIES, delay, exc,
                    )
                    await asyncio.sleep(delay)
                    delay *= 2
                    continue
                raise
