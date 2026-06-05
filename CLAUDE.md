# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Start backend + open frontend:
```powershell
.\run.ps1
```

Or start backend only:
```powershell
.venv\Scripts\uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

`run.ps1` kills any process on port 8000 first — safe to run repeatedly. Frontend is static HTML; open `frontend/index.html` directly or via `http://127.0.0.1:8000/frontend/index.html`.

## Environment Variables

Required in `backend/.env`:
```
KRAKEN_API_KEY=...
KRAKEN_SECRET=...
GOOGLE_SERVICE_ACCOUNT_FILE=backend/credentials.json
GOOGLE_SPREADSHEET_ID=...
```

Missing or placeholder values silently fall back to mock data — the app runs without real credentials.

## Backend Architecture

All routes are currently in `backend/main.py`. **Always split new route domains into `backend/routers/<domain>.py`** and register with `app.include_router(...)` in `main.py`. Never add new route groups directly to `main.py`.

Every endpoint must have a live path and a mock fallback that returns the same response shape. `get_kraken_client()` / `get_sheets_client()` return `None` when unconfigured; callers fall through to mock.

## Code Style

- Format with `ruff format backend/` and lint with `ruff check backend/` before finishing any Python task.
- Type hints required on all function signatures.

## Frontend

- Pure HTML/JS/CSS — no build step, no bundler, no TypeScript.
- Retro terminal aesthetic: JetBrains Mono font, dark background, warm bronze/gold accents. Do not introduce flat/modern design patterns.
- Designed for ultrawide (3448×1440). Test at that resolution.
- API calls are hardcoded to `http://127.0.0.1:8000` — this is local-only by design.

## Deployment

Local machine only. CORS wildcard (`allow_origins=["*"]`) is intentional. Do not add auth or harden for public access.

## Prompt Conventions

When a message begins with `<tabname>:` (e.g. `overview:`, `crypto:`, `budget:`), everything after the colon is a change request scoped to that dashboard tab. Valid tab names match the sidebar nav: `overview`, `budget`, `stella`, `crypto`, `investments`, `health`, `utilities`, `news`.

When this prefix is present:
- Focus HTML changes on `#view-<tabname>` in `frontend/index.html`
- Focus JS changes on the matching render function in `frontend/app.js` (e.g. `renderCryptoScreen()`)
- Limit CSS additions to classes used exclusively in that view
- Do not touch other tabs unless explicitly asked
