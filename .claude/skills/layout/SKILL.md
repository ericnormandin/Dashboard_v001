---
name: layout
description: Layout updater for Dashboard_v001. Scans Design_Mockup/Layout for PNG mockups, lets the user pick one, then asks whether to apply the grid layout, update content inside specific panels, or both.
---

## Overview

This skill reads mockup images from `G:\Dashboard\Dashboard_v001\Design_Mockup\Layout` and applies their design to the corresponding dashboard tab. It operates in two modes:

- **Layout mode** — updates the CSS grid (panel positions and sizes) based on red outline boxes in the mockup.
- **Panel content mode** — updates the HTML/JS/CSS content *inside* selected panels to match what the mockup shows inside them.

Both modes can be applied in a single run.

---

## Step 1 — Scan for available layouts

Use the Glob tool to list all `.png` (and `.jpg`, `.jpeg`, `.webp`) files under:

```
G:\Dashboard\Dashboard_v001\Design_Mockup\Layout
```

Extract just the base filename (without extension) for each file — that is the layout name. Sort alphabetically. Ignore files inside sub-folders for this list (sub-folder files are per-panel mockups, handled separately).

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

## Step 2 — Show mockup selection

**Always present this menu every time the skill runs.** The user iterates on the same mockup repeatedly; never skip or infer the selection.

Use `AskUserQuestion` — single select:

- **question**: `"Which mockup would you like to apply?"`
- **header**: `"Mockup"`
- **multiSelect**: `false`
- **options**: one per file, `label` = filename stem, `description` = relative path

---

## Step 3 — Extract panels and ask for scope

After the mockup is selected, determine the tab name (lowercase filename stem, e.g. `"stella"`).

### 3a — Extract panel names from the HTML

Use Grep to find all panel labels inside `#view-{tabname}` in `frontend/index.html`:

```
pattern:  panel-label
path:     frontend/index.html
output:   content
```

From the matching lines, extract the `*.sys` names (strip icon HTML, keep the `something.sys` text). Also collect the panel element IDs (e.g. `panel-stella-photos` → `photos.sys`). Build a deduplicated list of panel names in the order they appear.

### 3b — Ask for scope (paginated)

The `AskUserQuestion` tool is capped at 4 options. Use the following pagination strategy so all panels are reachable:

**Page 1** — always the same structure:
- Option 1: `"Only layout"` — `"Apply grid positions and sizes only — ignore panel content"`
- Options 2–4: panels 1–3 from your extracted list (in DOM order)

```
question:    "What should be applied? (page 1 of N)"
header:      "Scope"
multiSelect: true
options:     [ "Only layout", panel1, panel2, panel3 ]
```

**After page 1**, check: did the user select anything from this page? Then ask follow-up pages for the remaining panels, 3 at a time, until all panels have been offered. Each follow-up page looks like:

```
question:    "Any more panels? (page 2 of N)"
header:      "More panels"
multiSelect: true
options:     [ "Done — no more panels", panel4, panel5, panel6 ]
```

Keep asking until either the user selects `"Done — no more panels"` or all panels have been shown. Accumulate all selected panel labels across all pages into a single set.

**Tip**: If the tab has ≤ 3 panels, only one page is needed — no follow-up required.

After all pages, interpret the accumulated selections as follows:

| Accumulated selection | Mode |
|---|---|
| "Only layout" selected (panel selections ignored) | **Layout-only mode** |
| One or more panels, "Only layout" NOT selected | **Panel content mode** |
| One or more panels AND "Only layout" selected | **Combined mode** — layout first, then panel content |
| Nothing selected / unclear | Default to layout-only mode |

---

## Step 4 — Confirm selection

Echo back the chosen mockup and mode so the user knows what will happen:

```
► Mockup : Stella  (Design_Mockup/Layout/Stella.png)
► Mode   : Panel content  →  photos.sys, health.sys
  Reading files...
```

or

```
► Mockup : Stella  (Design_Mockup/Layout/Stella.png)
► Mode   : Layout only
  Reading files...
```

---

## Step 5 — Read source files

Convert the filename stem to lowercase to get the **tab name**.

Read all three source files in full:

| File | Scope |
|---|---|
| `frontend/index.html` | The `#view-{tabname}` section only |
| `frontend/app.js` | The `render{Tabname}Screen()` function and any helpers it calls |
| `frontend/style.css` | CSS classes used exclusively in that view |

---

## Step 6 — Read the mockup image

Use the Read tool to open the image at its full path. The tool renders images visually.

### In Layout-only mode or Combined mode — study for grid structure:

- **Red outline boxes** — ground truth for panel position and size. Measure pixel proportions and convert to `fr` units.
  - Measure each row height relative to total content height → `grid-template-rows`
  - Measure each column width relative to total content width → `grid-template-columns`
  - Note any panels that span multiple rows or columns
  - Do NOT default to equal fractions — always derive actual ratios from the image
- **White text labels** — identify which panel each box corresponds to

After reading, explicitly state the measured row and column ratios before writing any CSS.

### In Panel content mode or Combined mode — study selected panel interiors:

For each selected panel, zoom your attention to that panel's area in the mockup:

- Identify every visible UI element inside the panel: stat rows, charts, progress bars, buttons, labels, images, lists, grids, tables, etc.
- Note the visual order and grouping of elements (top to bottom, left to right)
- Note any elements that are present in the mockup but missing from the current HTML, or vice versa
- Note layout within the panel: is it a flex column? a two-column grid? stacked sections?
- Note any new text labels, section headers, or data categories shown

Do this analysis per selected panel before writing any code.

---

## Step 7 — Diff mockup against current state

### Layout-only or Combined mode — grid diff:

```
LAYOUT DIFF — Stella
────────────────────────────────────────
  COLUMNS  : 2.4fr 2fr 2fr 1.6fr 1fr  (measured from box widths)
  ROWS     : 1fr 1.25fr auto           (row 2 ~25% taller than row 1)
  MOVED    : (none)
  RESIZED  : health.sys — wider in col 4
  NEW      : (none)
  REMOVED  : (none)
────────────────────────────────────────
```

### Panel content mode or Combined mode — per-panel content diff:

For each selected panel, output a compact diff block:

```
PANEL DIFF — photos.sys
────────────────────────────────────────
  ADDED    : album filter tabs (ALL / RECENT / STARRED)
  CHANGED  : photo grid from 4-col to 3-col
  REMOVED  : "42 PHOTOS · 6 ALBUMS" count in header
────────────────────────────────────────
```

State all findings before touching any code.

---

## Step 8 — Implement the changes

Apply only what the diff identified. Follow all project rules at all times.

### Layout changes (Layout-only or Combined mode):

- **CSS**: update `#view-{tabname}` grid definition in `frontend/style.css` — `grid-template-areas`, `grid-template-columns`, `grid-template-rows`
- **HTML**: update `grid-area` inline styles on panels in `frontend/index.html` if areas were renamed or panels moved

### Panel content changes (Panel content mode or Combined mode):

For each selected panel:

- **HTML**: modify only the content *inside* that panel's `<div class="panel" id="panel-{tabname}-{name}">`. Do not change the panel's `grid-area`, `id`, or outer wrapper. Add, remove, or reorder child elements to match what the mockup shows.
- **JS**: if the panel's content is rendered dynamically (by a JS function), update that render function in `frontend/app.js` to match the new structure. Use mock data for any new data fields not yet backed by an API.
- **CSS**: add new CSS classes only for new UI elements introduced in this panel. Scope them to this panel (prefix with `#panel-{tabname}-{name}` or a panel-specific class).

### Always:

- Do not add features, abstractions, or cleanup beyond what the mockup shows
- Keep the retro terminal aesthetic: JetBrains Mono, dark background, bronze/gold accents, square corners — never introduce flat/modern design patterns
- No Python changes unless the mockup shows a brand-new data source. If needed, follow the router-per-domain rule and run `ruff format backend/` + `ruff check backend/` before finishing

---

## Step 9 — Report completion

```
LAYOUT_TOOL — Done  ✓
────────────────────────────────────────
Applied mockup: Design_Mockup/Layout/Stella.png
Mode: Combined (layout + photos.sys, health.sys)

  CHANGED  frontend/style.css   — grid-template-columns updated
  CHANGED  frontend/index.html  — photos.sys: 3-col grid, album tabs added
  CHANGED  frontend/app.js      — _renderStellaPhotos() updated
────────────────────────────────────────
Reload the frontend to see changes.
```

If any part of the mockup was ambiguous or not implemented, note it clearly so the user can follow up.
