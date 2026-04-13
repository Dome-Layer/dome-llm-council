import os
from dataclasses import dataclass

from dotenv import load_dotenv

from providers import ClaudeProvider, GeminiProvider, LLMProvider, OpenAIProvider

load_dotenv()


@dataclass
class CouncilConfig:
    claude: ClaudeProvider
    gemini: GeminiProvider
    openai: OpenAIProvider
    synthesizer: LLMProvider
    supabase_url: str = ""
    supabase_service_role_key: str = ""


def build_council_config() -> CouncilConfig:
    anthropic_key = os.environ["ANTHROPIC_API_KEY"]
    google_key = os.environ["GOOGLE_AI_API_KEY"]
    openai_key = os.environ["OPENAI_API_KEY"]
    synthesizer_model = os.getenv("SYNTHESIZER_MODEL", "claude-opus-4-6")

    claude = ClaudeProvider(api_key=anthropic_key)
    gemini = GeminiProvider(api_key=google_key)
    openai = OpenAIProvider(api_key=openai_key)

    if synthesizer_model.startswith("claude"):
        synthesizer: LLMProvider = ClaudeProvider(api_key=anthropic_key, model=synthesizer_model)
    elif synthesizer_model.startswith("gemini"):
        synthesizer = GeminiProvider(api_key=google_key, model=synthesizer_model)
    else:
        synthesizer = OpenAIProvider(api_key=openai_key, model=synthesizer_model)

    return CouncilConfig(
        claude=claude,
        gemini=gemini,
        openai=openai,
        synthesizer=synthesizer,
        supabase_url=os.getenv("SUPABASE_URL", ""),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
    )
