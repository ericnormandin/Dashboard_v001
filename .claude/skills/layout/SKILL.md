---
name: layout
description: Layout updater for Dashboard_v001. Scans Design_Mockup/Layout for PNG mockups, lets the user pick one, reads the image, then updates the matching dashboard tab to match the design.
---

## Overview

This skill reads mockup images from `G:\Dashboard\Dashboard_v001\Design_Mockup\Layout` and applies their layout to the corresponding dashboard tab. The image filename maps directly to the tab name (e.g. `Crypto.png` → the Crypto tab).

---

## Step 1 — Scan for available layouts

Use the Glob tool to list all `.png` (and `.jpg`, `.jpeg`, `.webp`) files under:

```
G:\Dashboard\Dashboard_v001\Design_Mockup\Layout
```

Extract just the base filename (without extension) for each file — that is the layout name. Sort alphabetically.

If the folder is empty or contains no image files, tell the user:

```
LAYOUT_TOOL — No mockups found
────────────────────────────────────────
No image files found in Design_Mockup/Layout/.
Drop a PNG named after the tab (e.g. Crypto.png) to get started.
────────────────────────────────────────
```

Then stop.

---

## Step 2 — Show selection menu

Use the `AskUserQuestion` tool to present a single-select question. Build the options list dynamically from the filenames found in Step 1:

- **question**: `"Which mockup would you like to apply?"`
- **header**: `"Mockup"`
- **multiSelect**: `false`
- **options**: one entry per file, with `label` = filename stem (e.g. `"Crypto"`) and `description` = the relative path (e.g. `"Design_Mockup/Layout/Crypto.png"`)

Wait for the user to select an option. The selected label is the layout name; proceed to Step 3.

---

## Step 3 — Confirm selection

Echo back the chosen layout name so the user knows what was selected:

```
► Selected: Crypto  (Design_Mockup/Layout/Crypto.png)
  Reading mockup image and current tab files...
```

---

## Step 4 — Map filename to tab context

Convert the filename stem to lowercase to get the **tab name** (`crypto`, `stella`, `overview`, etc.).

This determines which files to read and modify:

| File | Scope |
|---|---|
| `frontend/index.html` | The `#view-{tabname}` section only |
| `frontend/app.js` | The `render{Tabname}Screen()` function and any helpers it calls |
| `frontend/style.css` | CSS classes used exclusively in that view |

Read all three files in full — they are large but needed for context.

---

## Step 5 — Read the mockup image

Use the Read tool to open the image file at its full path (e.g. `G:\Dashboard\Dashboard_v001\Design_Mockup\Layout\Crypto.png`). The tool renders images visually for multimodal inspection.

Study the mockup carefully:

- **Panel arrangement** — count panels, their grid positions, relative sizes (wide/narrow, tall/short)
- **Panel labels** — the `*.sys` header names shown in each panel
- **Content within panels** — charts, tables, lists, gauges, ticker rows, text blocks
- **Proportions** — column ratios (e.g. 2:1:1), row heights, which panels span multiple columns
- **Any new elements** not currently present in the HTML

---

## Step 6 — Diff mockup against current layout

Compare what you see in the image against the current `#view-{tabname}` HTML and CSS grid. Identify specifically:

- Panels that have moved to a different grid area
- Panels that have been resized (wider, taller, split, merged)
- New panels that don't exist yet
- Panels that have been removed
- Content within panels that has changed (new charts, different data, etc.)

State your findings in one compact block before touching any code:

```
LAYOUT DIFF — Crypto
────────────────────────────────────────
  MOVED   : fear_greed.sys — was bottom-left, now top-right
  RESIZED : trading_view.sys — now spans 2 cols
  NEW     : alerts.sys panel (bottom strip, full width)
  REMOVED : (none)
────────────────────────────────────────
Applying changes...
```

---

## Step 7 — Implement the layout changes

Apply only what differs. Follow all project rules:

- **HTML**: modify only the `#view-{tabname}` section in `frontend/index.html`. Adjust `grid-area` inline styles and panel structure. Do not touch other tabs.
- **CSS**: update the `#view-{tabname}` grid definition (`grid-template-areas`, `grid-template-columns`, `grid-template-rows`) in `frontend/style.css`. Add new CSS classes only for new UI elements; keep them scoped to this view.
- **JS**: if new panels need data rendered, update `render{Tabname}Screen()` in `frontend/app.js`. Do not add backend endpoints unless the mockup clearly implies new data that doesn't exist — use mock data for new panels.
- **No Python changes** unless the mockup shows a brand-new data source. If Python changes are needed, follow the router-per-domain rule and run `ruff format backend/` + `ruff check backend/` before finishing.
- Do not add features, abstractions, or cleanup beyond what the mockup shows.
- Keep the retro terminal aesthetic: JetBrains Mono, dark background, bronze/gold accents, square panel corners. Do not introduce flat/modern design patterns.

---

## Step 8 — Report completion

After all changes are applied, summarize in this format:

```
LAYOUT_TOOL — Done  ✓
────────────────────────────────────────
Applied mockup: Design_Mockup/Layout/Crypto.png

  CHANGED  frontend/index.html  — grid-area assignments, new alerts.sys panel
  CHANGED  frontend/style.css   — updated grid-template-areas (4-col → 3-col)
  CHANGED  frontend/app.js      — renderCryptoScreen() renders alerts list
────────────────────────────────────────
Reload the frontend to see changes.
```

If any part of the mockup was ambiguous or not implemented, note it clearly so the user can follow up.
