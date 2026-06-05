---
name: start
description: Start the dashboard backend server.
disable-model-invocation: true
---

Run the startup script:

```powershell
.\run.ps1
```

This kills any process on port 8000, starts uvicorn with `--reload` on `127.0.0.1:8000`, and opens the frontend in the default browser.

If `run.ps1` fails, start manually:

```powershell
.venv\Scripts\uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Then open: `http://127.0.0.1:8000/frontend/index.html`
