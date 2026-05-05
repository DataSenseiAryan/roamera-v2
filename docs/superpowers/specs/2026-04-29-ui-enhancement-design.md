# UI Enhancement — JustSplit, Budget Tracker, Packing List, TravelLens

**Date:** 2026-04-29  
**Scope:** Frontend only — 4 page files, no backend changes, no new components, no commits until user approves.

---

## Decisions

| Decision | Choice |
|---|---|
| Design system | Unified Glass — all features use existing CSS var tokens and `.glass` class |
| Form presentation | Centered modal overlay (all devices) |
| Card density | Mixed — comfortable primary cards, compact detail rows inside views |
| Implementation strategy | Inline refactor (Option 2) — no new shared components, each file reworked in place |

---

## Shared Patterns

### CSS Variable Replacements
Every hardcoded dark color in Budget Tracker, Packing List, and JustSplit is replaced with a CSS variable so both Day and Night themes work correctly.

| Hardcoded value | Replace with |
|---|---|
| `text-white` | `style={{ color: 'var(--text)' }}` |
| `text-slate-400`, `text-slate-500` | `style={{ color: 'var(--text-muted)' }}` |
| `text-slate-300` | `style={{ color: 'var(--text)' }}` with reduced opacity or `var(--text-muted)` |
| `bg-white/5`, `bg-white/10`, `rgba(255,255,255,0.04)` | `.glass` class or `style={{ background: 'var(--surface)' }}` |
| `border-white/10`, `rgba(255,255,255,0.08)` | `style={{ border: '1px solid var(--border)' }}` |
| `bg-slate-800`, `rgba(30,41,59,1)` (selects) | `style={{ background: 'var(--surface)' }}` |
| `#0d0d1f` (modal bg) | `var(--surface)` |
| `bg-sky-500`, `bg-violet-500` (primary buttons) | `style={{ background: 'var(--primary)' }}` |
| `text-sky-400`, `text-violet-400` | `style={{ color: 'var(--primary)' }}` |
| Hover states `bg-white/5` | `var(--surface-hover)` |
| `rgba(124,58,237,0.2)` avatar backgrounds | `rgba(var(--primary-rgb),0.12)` |

### Modal Pattern
All "Add / Create / New" forms use this wrapper — inline per file, no extracted component:

```jsx
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
    <div className="w-full max-w-md rounded-[1.5rem] p-6 shadow-2xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* form content */}
    </div>
  </div>
)}
```

- Max width `max-w-md` (448px) — full width on small screens via `p-4` on overlay
- Clicking the backdrop closes the modal (the `onClick` check on `e.currentTarget`)
- Form fields use `var(--surface-hover)` background, `var(--border)` border, `var(--text)` text
- Label style: `text-xs font-bold uppercase tracking-wide` + `color: var(--text-muted)`
- Primary submit button: `background: var(--primary)`, white text
- Cancel button: `background: var(--surface-hover)`, `color: var(--text-muted)`

### Card Density Rules
- **Comfortable** (primary navigation cards): `p-4` padding, `2.4rem` avatar, `rounded-2xl`
- **Compact** (detail rows inside a view): `py-2.5 px-3` or `py-3 px-4`, `1.75rem` avatar, `rounded-xl`
- Section category headers inside lists: `py-2 px-4`, `bg: var(--surface-hover)`, small uppercase label

---

## Feature: JustSplit

### Files
- `frontend/src/pages/JustSplit.jsx`
- `frontend/src/pages/JustSplitDetail.jsx`

### JustSplit.jsx (groups list page)
**Color fixes:** All hardcoded dark colors → CSS vars per mapping above.

**Group cards:** Comfortable density. Each group card is a `rounded-2xl` `.glass` card with:
- `2.4rem` avatar (first letter, `rgba(var(--primary-rgb),0.12)` bg, `var(--primary)` text)
- Group name `font-bold text-sm` in `var(--text)`
- Subtitle `text-xs` in `var(--text-muted)`
- Chevron `›` in `var(--text-muted)`

**"+ New Group" button:** Opens centered modal (replaces inline panel). Button style: `var(--primary)` background.

**Create Group modal fields:** Name, Description, Currency — all using CSS var field styling above.

**Empty state:** Same structure, colors fixed to CSS vars.

### JustSplitDetail.jsx (group detail page)
**Color fixes:** All hardcoded dark → CSS vars.

**Header back-button / delete:** `var(--text-muted)` colors.

**Action buttons row:**
- "Add Expense" → `var(--primary)` tinted button, opens modal
- "Add Member" → `var(--surface-hover)` ghost button, opens modal

Both replace the current inline `showExpense` / `showMember` panels.

**Add Expense modal:** Full form — Description, Amount+Category (2-col grid), Paid By+Date (2-col grid), Split Among pill toggles. Pill toggles: selected = `var(--primary-dim)` bg + `var(--primary)` border + text; unselected = `var(--surface-hover)`.

**Add Member modal:** Username field + divider + Name field.

**Tabs:** Track = `var(--surface)` + `var(--border)`. Active tab = `var(--primary)` bg, white text. Inactive = `var(--text-muted)`. Badge on Requests: red `#ef4444`.

**Balances tab — balance rows (compact):**
- Flex row: `py-3 px-1`, separator `<hr>` using `var(--border)`
- "owes" label in `var(--text-muted)`, names in red-400 / green-400 (semantic, not theme-dependent)
- Settle button: ghost style, `var(--surface-hover)` bg

**Settle confirm modal:** Already a modal structurally — restyle backdrop + inner card with CSS vars.

**Net Balances section:** `var(--surface)` bg, `var(--border)` border. Net amounts stay green/red/muted as semantic indicators.

**Expenses tab — expense rows (compact):**
- Icon + title + subtitle + amount in a compact `py-3 px-4` row with `var(--surface-hover)` hover
- Delete button: `var(--text-muted)` → red on hover

**Members tab — member rows (compact):** `1.75rem` avatar, name in `var(--text)`, "App user / Guest" in `var(--text-muted)`.

**Join requests tab:** Requester avatar + username, Approve/Decline buttons with semantic green/red tints.

**Non-member view:** Colors fixed, request card uses CSS vars.

---

## Feature: Budget Tracker

### File
- `frontend/src/pages/JournalBudget.jsx`

**Color fixes:** All hardcoded values → CSS vars.

**Header:** Back link in `var(--text-muted)`, title in `var(--text)`. "Add Expense" button → `var(--primary)` bg.

**Stat cards (comfortable):** 3-column grid (`grid-cols-1 sm:grid-cols-3`). Each card: `var(--surface)` bg, `var(--border)` border, `rounded-2xl`, `p-4`. Label in `var(--text-muted)`, value in `var(--text)`. Remaining card: green tint uses `rgba(16,185,129,0.06)` bg + `rgba(16,185,129,0.3)` border (semantic green, theme-safe). Over-budget: equivalent red tint.

**Progress bar:** Track = `var(--border)`. Fill: `var(--primary)` when ≤70%, yellow-500 when ≤90%, red-500 when >90% (these are semantic, kept as-is). Percentage text in `var(--text-muted)`.

**Pie chart tooltip:** `contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)' }}`. Legend text: `var(--text)`.

**Category breakdown card:** `var(--surface)` bg. Category label in `var(--text)`, amount in `var(--text-muted)`. Bar track = `var(--border)` (colored fill stays as category color — those are data colors, not theme colors).

**"Add Expense" button:** Opens centered modal instead of inline form toggle.

**Add Expense modal:** Description (full width), Amount + Category (2-col), Date + Notes (2-col). Select `background: var(--surface)`.

**Expense list:** Outer container `var(--surface)` bg + `var(--border)`. Header row border = `var(--border)`. Each row: icon + title + date/notes sub-text + amount + delete. `var(--surface-hover)` on row hover. Dividers use `var(--border)`.

---

## Feature: Packing List

### File
- `frontend/src/pages/JournalPacking.jsx`

**Color fixes:** All hardcoded values → CSS vars.

**Header:** Same pattern as Budget Tracker. "New List" → `var(--primary)` button → opens modal.

**Overall progress card (comfortable):** `var(--surface)` bg, `var(--border)` border. Progress bar: `var(--primary)` fill (green when 100%).

**Filter pills:** Active = `var(--primary)` bg + white text. Inactive = `var(--text-muted)` text, transparent bg. Hover = `var(--surface-hover)`.

**"New List" modal:** Name field + template selector buttons. Template button active state: `var(--primary-dim)` bg + `var(--primary)` border + text. Inactive: `var(--surface-hover)` bg + `var(--border)` border.

**List cards (comfortable header, compact items):**
- Card container: `var(--surface)` bg + `var(--border)`, `rounded-2xl`, overflow hidden
- Header row: `p-4`, `var(--border)` bottom border. Name in `var(--text)`, count in `var(--text-muted)`, inline progress bar, "Add Item" text button, delete icon
- "Add Item" → opens centered modal (replaces current `flex-wrap` inline form)
- Category section headers: `var(--surface-hover)` bg, uppercase `var(--text-muted)` label
- Item rows (compact): `py-2.5 px-4`, `var(--surface-hover)` hover
  - Checkbox: unchecked = `var(--border)` border; checked = `var(--primary)` bg + white tick
  - Item name: `var(--text)` when unpacked, `var(--text-muted)` + strikethrough when packed
  - Quantity `×N` in `var(--text-muted)`
  - Essential badge: amber tint (semantic, theme-safe as-is)
  - Delete: `var(--text-muted)` → red on hover

**Add Item modal:** Name (full width), Category + Qty (2-col grid), Essential checkbox row, Add/Cancel buttons. Select uses `var(--surface)` bg. State: replace `showAddItem` (which held a `listId`) with `addItemForList` (same type — `null | number`) so the modal knows which list to post to. No logic change, just a rename for clarity.

**Empty state:** Colors fixed to CSS vars.

---

## Feature: TravelLens

### File
- `frontend/src/pages/TravelLens.jsx`

TravelLens already uses `var(--*)` tokens throughout. Only two fixes needed:

1. **Input focus ring:** All `<input>` elements have `focus:outline-none` but no visible focus indicator. Add `onFocus`/`onBlur` state or use CSS: add `focus:border-[var(--primary)]` (Tailwind) or inline `style` swap on focus.

2. **Search form date grid on mobile:** The 4-column date/guests row (`grid-cols-2 sm:grid-cols-4`) currently has no single-column breakpoint. On very small screens (< 400px) the 2-col grid can be tight. Change to `grid-cols-1 xs:grid-cols-2 sm:grid-cols-4` — or simply accept 2-col as the minimum (already reasonable on 375px).

No modal changes needed — TravelLens has no create/edit forms.

---

## Responsiveness Rules (all features)

| Breakpoint | Behaviour |
|---|---|
| `< 640px` (mobile) | Single column layouts. Modal `p-4` wrapper gives full-width feel. Stat cards stack to 1 col. |
| `640px–1024px` (tablet) | Stat cards 3-col. Budget/Packing side-by-side sections become visible. |
| `> 1024px` (desktop) | Max-width containers: JustSplit `max-w-2xl`, Budget/Packing `max-w-4xl`, TravelLens `max-w-2xl` (search) + `max-w-5xl` (results). |

Modal sizing: `w-full max-w-md` — fills screen on mobile with `p-4` overlay padding, constrained to 448px on larger screens.

---

## What Does NOT Change

- All API calls, state management, form `onSubmit` handlers — untouched
- All route structure and navigation — untouched
- TravelLens flight/hotel card structure — untouched (already correct)
- JustSplitDetail tab logic, balance computation — untouched
- Recharts `PieChart` component structure — only tooltip style changes
- `confirm()` dialogs (delete expense, delete list, delete group) — kept as-is
- No new files created, no shared components extracted
