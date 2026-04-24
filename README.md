# [Tool name]

*[One-line description of what this tool does.]*

Part of the Dome portfolio. For full tool specification see [`TOOL_CONTEXT.md`](./TOOL_CONTEXT.md). For cross-cutting Dome context see [dome-docs](../dome-docs/).

---

## Quick start

### Requirements
- Python 3.12
- Node.js 20+
- [Any tool-specific requirements — e.g., "Docker for air-gapped testing"]

### Setup

```bash
# Clone
git clone https://github.com/dome-layer/[tool-repo-name].git
cd [tool-repo-name]

# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install

# Environment
cp .env.example .env
# Edit .env with required values — see Environment variables below
```

### Run locally

```bash
# Backend (from backend/)
uvicorn main:app --reload --port 8000

# Frontend (from frontend/, in a second terminal)
npm run dev
```

Visit `http://localhost:3000`.

---

## Environment variables

See `.env.example` for the full list. Required variables:

- `LLM_PROVIDER` — `claude` (cloud demo), `azure_openai` (client tenant), or `ollama` (air-gapped)
- `[provider-specific keys]` — e.g., `ANTHROPIC_API_KEY` for Claude

Never commit real secrets. The `.env` file is gitignored; `.env.example` is not.

---

## Deployment

### Cloud demo (domelayer.com)
- Frontend: Vercel (EU region: Netherlands)
- Backend: Railway (EU region: Germany)

### Client Azure tenant
[Tool-specific Azure deployment notes. See `TOOL_CONTEXT.md` §Architecture for details.]

### Air-gapped
[Tool-specific air-gapped deployment notes. See `TOOL_CONTEXT.md` §Architecture for details.]

---

## Repository structure

```
[tool-repo-name]/
├── TOOL_CONTEXT.md         Full tool specification (read this first)
├── README.md               This file
├── backend/                FastAPI service
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               Next.js app
│   ├── app/
│   ├── components/
│   └── package.json
├── .env.example            Environment variable template
└── .gitignore
```

---

## Related

- [dome-docs](../dome-docs/) — cross-cutting Dome documentation
- [`TOOL_CONTEXT.md`](./TOOL_CONTEXT.md) — full spec for this tool
- [Portfolio status](../dome-docs/PORTFOLIO_STATUS.md)
