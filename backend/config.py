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
    environment: str = "development"
    allowed_origins: list[str] = None  # type: ignore[assignment]


def build_council_config() -> CouncilConfig:
    anthropic_key = os.environ["ANTHROPIC_API_KEY"]
    google_key = os.environ["GOOGLE_AI_API_KEY"]
    openai_key = os.environ["OPENAI_API_KEY"]
    synthesizer_model = os.getenv("SYNTHESIZER_MODEL", "claude-opus-4-6")
    claude_model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    openai_model = os.getenv("OPENAI_MODEL", "gpt-4o")

    claude = ClaudeProvider(api_key=anthropic_key, model=claude_model)
    gemini = GeminiProvider(api_key=google_key, model=gemini_model)
    openai = OpenAIProvider(api_key=openai_key, model=openai_model)

    if synthesizer_model.startswith("claude"):
        synthesizer: LLMProvider = ClaudeProvider(api_key=anthropic_key, model=synthesizer_model)
    elif synthesizer_model.startswith("gemini"):
        synthesizer = GeminiProvider(api_key=google_key, model=synthesizer_model)
    else:
        synthesizer = OpenAIProvider(api_key=openai_key, model=synthesizer_model)

    allowed_origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    allowed_origins = [o.strip() for o in allowed_origins_raw.split(",") if o.strip()]

    return CouncilConfig(
        claude=claude,
        gemini=gemini,
        openai=openai,
        synthesizer=synthesizer,
        supabase_url=os.getenv("SUPABASE_URL", ""),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        environment=os.getenv("ENVIRONMENT", "development"),
        allowed_origins=allowed_origins,
    )
