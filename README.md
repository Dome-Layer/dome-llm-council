# Dome LLM Council

*Three AI advisors deliberate on your question, cross-examine each other, and produce a governed verdict with a confidence score and full audit trail.*

Part of the Dome portfolio. For full tool specification see [`TOOL_CONTEXT.md`](./TOOL_CONTEXT.md). For cross-cutting Dome context see [dome-docs](../dome-docs/).

---

## Quick start

### Requirements
- Python 3.12
- Node.js 20+
- API keys for Anthropic, Google AI, and OpenAI

### Setup

```bash
# Clone
git clone https://github.com/[your-github-org]/dome-llm-council.git
cd dome-llm-council

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install

# Environment
cp backend/.env.example backend/.env
# Edit backend/.env with your real values — see Environment variables below
```

### Run locally

```bash
# Terminal 1 — Backend (from backend/)
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend (from frontend/)
npm run dev
```

Visit `http://localhost:3000`. Health check: `http://localhost:8000/health`.

---

## Environment variables

### Backend — `backend/.env`

Copy `backend/.env.example` and fill in real values. Never commit the `.env` file (it is gitignored).

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key — used for Claude (Strategic Advisor) and the default synthesizer |
| `GOOGLE_AI_API_KEY` | ✅ | Google AI Studio key — used for Gemini (Research Analyst) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key — used for GPT-4o (Critical Advisor) |
| `SYNTHESIZER_MODEL` | optional | Model that writes the final verdict. Default: `claude-opus-4-6`. Prefix determines provider: `claude` → Anthropic, `gemini` → Google, anything else → OpenAI |
| `SUPABASE_URL` | optional | Supabase project URL. If absent, governance persistence and auth are disabled and the tool runs stateless |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | Supabase service role key used for auth verification and DB writes. Required when `SUPABASE_URL` is set |

### Frontend — `frontend/.env.local`

Create `frontend/.env.local` (not included in the repo):

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | optional | Backend base URL. Defaults to `http://localhost:8000` if absent |

---

## How it works

Each deliberation runs in three phases, streamed to the browser via Server-Sent Events:

1. **Round 1 — Parallel:** Claude (Strategic Advisor), Gemini (Research Analyst), and GPT-4o (Critical Advisor) each receive the question with a distinct role prompt and respond independently.
2. **Round 2 — Cross-examination:** Each member reads the other two members' Round 1 responses and refines or affirms their position.
3. **Verdict:** A configurable synthesizer model reads all six responses and produces a structured output — `VERDICT`, `REASONING`, `DISSENT`, `RECOMMENDATION`, and a `Confidence` score. A `GovernanceEvent` is emitted and optionally persisted to Supabase.

---

## Deployment

### Cloud demo (domelayer.com)
- **Frontend:** [TODO — confirm hosting provider and region]
- **Backend:** [TODO — confirm hosting provider and region]
- **Live URL:** https://llm-council.domelayer.com

### Client Azure tenant
Not implemented. The provider layer (`backend/providers/`) would need an Azure OpenAI provider. See `TOOL_CONTEXT.md` §Architecture for details.

### Air-gapped
Not implemented. No Ollama or local model support exists. See `TOOL_CONTEXT.md` §Architecture for details.

---

## Repository structure

```
dome-llm-council/
├── TOOL_CONTEXT.md              Full tool specification
├── README.md                    This file
├── .gitignore
├── backend/
│   ├── main.py                  FastAPI entry point — /deliberate SSE, /api/v1/... REST
│   ├── config.py                Provider wiring and CouncilConfig
│   ├── auth.py                  Supabase Bearer token auth dependency
│   ├── db.py                    Cached Supabase client
│   ├── Dockerfile               python:3.12-slim, port 8000
│   ├── requirements.txt
│   ├── .env.example             Environment variable template (replace values before committing)
│   ├── council/
│   │   ├── orchestrator.py      Two-round deliberation flow + verdict synthesis
│   │   ├── roles.py             Role system prompts and Round 2 / verdict templates
│   │   └── scoring.py           Confidence score extraction from LLM responses
│   ├── governance/
│   │   └── logger.py            GovernanceEvent builder (rules, thresholds, input hashing)
│   ├── models/
│   │   ├── request.py           DeliberationRequest schema
│   │   └── response.py          CouncilMemberResponse, VerdictResponse, GovernanceEvent
│   └── providers/
│       ├── base.py              LLMProvider abstract base class
│       ├── claude.py            Anthropic provider (claude-sonnet-4-6 default)
│       ├── gemini.py            Google GenAI provider (gemini-2.5-flash, retry + fallback)
│       └── openai.py            OpenAI provider (gpt-4o default)
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── page.tsx          Main deliberation UI ("Ask the Panel")
        │   ├── layout.tsx        Root layout with Header and Footer
        │   ├── globals.css       Dome design tokens and base styles
        │   ├── AuthGuard.tsx     Redirects unauthenticated users to login
        │   ├── components/       Page-level components (CouncilCard, VerdictPanel, etc.)
        │   ├── auth/             Magic link callback and sign-in page
        │   └── saved/            Saved deliberations list and detail view
        ├── components/           Shared components (Header, Footer, ThemeToggle, etc.)
        ├── context/              React context for auth state
        ├── lib/                  API client utilities
        └── types/                SSE event types and shared TypeScript types
```

---

## Related

- [dome-docs](../dome-docs/) — cross-cutting Dome documentation
- [`TOOL_CONTEXT.md`](./TOOL_CONTEXT.md) — full spec for this tool (architecture, governance, prompts, limitations)
- [Portfolio status](../dome-docs/PORTFOLIO_STATUS.md)
