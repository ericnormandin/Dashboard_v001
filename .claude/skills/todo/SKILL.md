---
name: todo
description: Project backlog manager for Dashboard_v001. Three modes — /todo <note> <1|2|3> adds an item, /todo go shows a priority-sorted list to pick from then implements the selected item, /todo list browses all pending items.
disable-model-invocation: true
---

## Routing

Parse $ARGUMENTS to determine the mode:

- `go` (exactly, or starts with "go") → **IMPLEMENT NEXT** mode
- `list` (exactly, or starts with "list") → **LIST** mode
- Anything else → **ADD** mode

The todo file lives at: `G:\Dashboard\Dashboard_v001\.claude\todo.md`

---

## Mode: ADD

The user is adding a new item to the backlog. Their input is: $ARGUMENTS

**Step 1 — Parse priority**
Extract the number at the end of the input (1, 2, or 3). Default to 2 if absent. Strip it from the description before continuing.
- 1 = High — core feature or blocker, implement soon
- 2 = Medium — important but not urgent
- 3 = Low — nice to have, implement later

**Step 2 — Generate a title**
3 to 6 words, title case, no punctuation. Be specific to the component or feature (e.g. "Kraken Balance Panel Auto-Refresh", not just "Auto-Refresh").

**Step 3 — Rephrase into implementation instructions**
Rewrite the user's note as clear, actionable developer instructions (2–5 sentences). Include:
- What needs to be built, changed, or added
- Which files are likely involved (backend router, frontend panel, CSS component, etc.)
- Specific behavior or UX details mentioned
Make reasonable assumptions based on the stack (FastAPI backend, vanilla JS/HTML/CSS frontend, retro terminal aesthetic).

**Step 4 — Append to todo file**
If the file does not exist, create it with this header:
```
# Dashboard_v001 — Project Backlog

Usage: /todo <note> <1|2|3> | /todo list | /todo go
Priority: 1 = High  2 = Medium  3 = Low

---

```

Append the entry in this format:
```
### [P{priority}] {Title}
**Priority:** {1/2/3} — {High/Medium/Low}
**Added:** {YYYY-MM-DD}
**Status:** pending

{Rephrased implementation instructions}

---

```

**Step 5 — Confirm**
Show the user the title, priority, and rephrased instructions so they can verify it was captured correctly.

---

## Mode: LIST

**Step 1 — Read and parse the todo file**
Read `todo.md`. Extract all entries where `**Status:** pending`. For each, capture: title, priority number, and order in file.

**Step 2 — Sort and display**
Sort: P1 first, P2 second, P3 third. Within same priority, preserve file order.

If the list is empty, tell the user the backlog is empty and suggest using `/todo <note> <priority>` to add items.

Use the `AskUserQuestion` tool to present a single-select question:
- **question**: `"Which backlog item do you want to implement?"`
- **header**: `"Backlog"`
- **multiSelect**: `false`
- **options**: one entry per pending item, `label` = `"[P{n}] {Title}"`, `description` = first sentence of the implementation instructions

**Step 3 — Wait for selection**
The user selects an option. Map the selected label to the item and immediately follow the IMPLEMENT logic below — no confirmation prompt.

---

## Mode: IMPLEMENT NEXT (go)

**Step 1 — Read and sort pending items**
Read `todo.md`. Extract all entries where `**Status:** pending`. Sort: P1 first, P2 second, P3 third. Within the same priority, preserve file order.

If the backlog is empty, tell the user and stop.

**Step 2 — Show selection menu**
Use the `AskUserQuestion` tool to present a single-select question:
- **question**: `"Which item do you want to implement next?"`
- **header**: `"Backlog"`
- **multiSelect**: `false`
- **options**: one entry per pending item (sorted P1→P2→P3), `label` = `"[P{n}] {Title}"`, `description` = first sentence of the implementation instructions

**Step 3 — Wait for selection**
The user selects an option. Map the selected label to the item and immediately follow the IMPLEMENT logic below — no confirmation prompt.

---

## IMPLEMENT logic (shared by LIST and IMPLEMENT NEXT)

Used when implementing a specific item (from `/todo go` or selected from `/todo list`):

### Step 0 — Pre-implementation check (REQUIRED before touching any file)

Before writing a single line of code, scan the codebase to determine whether the feature is already implemented:

1. Extract 3–5 key identifiers from the todo instructions: HTML element IDs, function names, CSS class names, API route paths, file names mentioned.
2. Grep the `frontend/` and `backend/` directories for those identifiers.
3. Evaluate findings:
   - **Clear evidence found** (e.g. the endpoint exists, the HTML element is present, the function is defined): display what was found and warn the user:
     ```
     ⚠  ALREADY IMPLEMENTED?
     ────────────────────────────────────────
     Found evidence this item may already exist:
       • frontend/index.html:452 — id="retirement-ai-output"
       • frontend/app.js:1082 — function retirementAI(
       • backend/routers/retirement.py — POST /api/retirement/ai-plan
     ────────────────────────────────────────
     Proceed anyway? (yes / skip / mark-done)
     ```
     - **yes**: continue with implementation (user may want to update/extend it)
     - **skip**: return without changes
     - **mark-done**: update `**Status:**` to `done` with today's date and stop
   - **No evidence found**: print a one-line confirmation (`✓ No existing implementation detected. Proceeding.`) and continue.
   - **Partial evidence** (some but not all identifiers found): note what exists and what's missing, then ask: "Partially implemented — continue? (yes / skip)"

### Step 1 — Read relevant files
Read all files that will be modified before making changes.

### Step 2 — Implement
Execute the implementation instructions. Follow all CLAUDE.md rules:
- `ruff format backend/` and `ruff check backend/` after any Python edits
- Router-per-domain pattern: new route groups go in `backend/routers/<domain>.py`
- Every endpoint needs a live path and a mock fallback

### Step 3 — Mark as complete
After successful implementation, update the entry in `todo.md`:
- Change `**Status:** pending` to `**Status:** done`
- Add `**Completed:** {YYYY-MM-DD}` below it

Report what was changed and show the next pending item in the backlog (if any).
