from abc import ABC, abstractmethod
from typing import Optional

from pydantic import BaseModel


class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, system: Optional[str] = None) -> str: ...

    @abstractmethod
    async def generate_structured(
        self, prompt: str, schema: type[BaseModel], system: Optional[str] = None
    ) -> dict: ...
