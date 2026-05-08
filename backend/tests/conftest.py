import os

# build_council_config() reads these via os.environ[...] at lifespan startup.
# Set dummies before any test imports `main` so the FastAPI lifespan can build
# providers without real API access.
os.environ.setdefault("ANTHROPIC_API_KEY", "ci-dummy")
os.environ.setdefault("GOOGLE_AI_API_KEY", "ci-dummy")
os.environ.setdefault("OPENAI_API_KEY", "ci-dummy")
