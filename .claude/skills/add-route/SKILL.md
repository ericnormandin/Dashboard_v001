---
name: add-route
description: Add a new FastAPI router domain to the dashboard. Use when the user wants to add a new group of API endpoints (e.g., mail, calendar, weather, notifications).
---

When adding a new router domain, follow this pattern:

## 1. Create `backend/routers/<domain>.py`

```python
from fastapi import APIRouter
import logging

logger = logging.getLogger("dashboard_backend")
router = APIRouter(prefix="/api/<domain>", tags=["<domain>"])

def get_<domain>_client():
    # Return configured client or None if credentials missing
    ...

@router.get("/example")
async def get_example():
    client = get_<domain>_client()
    if client:
        try:
            # live path
            ...
            return {"mode": "live", ...}
        except Exception as e:
            logger.error(f"<Domain> API error: {e}")
    # mock fallback — same shape as live response
    return {"mode": "mock", ...}
```

Key rules:
- Every endpoint has a live path AND a mock fallback returning the same response shape
- `get_<domain>_client()` returns `None` when not configured (missing/placeholder env vars)
- Log errors with `logger.error(...)` before falling through to mock

## 2. Register in `backend/main.py`

Add after existing imports:
```python
from backend.routers.<domain> import router as <domain>_router
```

Add after existing `app.include_router(...)` calls:
```python
app.include_router(<domain>_router)
```

## 3. Frontend integration

In `frontend/app.js`, add fetch calls to the new endpoints following the existing pattern:
- Check `/api/status` first to determine live/mock mode
- Handle errors gracefully, showing mock UI state on failure

## 4. Environment variables

If the new domain needs credentials, add them to `backend/.env` and document them in CLAUDE.md.

## 5. Format and lint

```powershell
.venv\Scripts\ruff format backend\
.venv\Scripts\ruff check backend\
```
