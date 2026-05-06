# Sprint 5 -- Budget Tracker, Packing Lists, and S1-S4 Debt Cleanup

Sprint 5 adds two new feature tabs to the trip planner: **Budget** (categorized expenses, per-member splits, settlements, debt simplification) and **Packing** (checklist, categories, bags, templates, assignees). Both are real-time via WS broadcast to the trip room.

This plan has **7 parts**: (A) Sprint 1-4 debt cleanup, (B) schema migrations, (C) backend routes, (D) types + SDK, (E) frontend, (F) verification + docs, (G) git commit + push.

---

## Part A: Sprint 1-4 Debt Cleanup (pre-requisite)

- **"Save AI Plan as Trip" wired** — AI planner page now has a "Save as Trip" button that stores the itinerary in sessionStorage and navigates to `/trips?importPlan=true`, which opens CreateTripModal with the AI itinerary pre-filled.
- **Sprint verification doc URLs fixed** — `GET /users/me` → `GET /auth/me`; AI health URL corrected.
- **Account delete UX aligned** — Copy updated to "immediately and permanently deleted" (matching actual implementation behavior).
- **Mobile screens formally deferred to S11** in roadmap.

---

## Part B: Schema Migrations

Migration: `drizzle/0004_slow_gorilla_man.sql`

**New tables:**
- `packing_template_cats` — id, template_id (FK), name, sort_order
- `packing_template_items` — id, category_id (FK), name, quantity
- `packing_bag_items` — bag_id (FK), item_id (FK) junction
- `budget_category_order` — trip_id (FK), category, sort_order

**Modified existing stubs:**
- `packing_categories`: added `assignee_user_id` (FK users, nullable)
- `budget_item_members`: added unique index on `(budget_item_id, user_id)`

---

## Part C: Backend Routes

### C.1 Budget Routes (`apps/api/src/routes/budget.ts`)

Mounted at `/api/v1/trips/:tripId/budget`. 8 endpoints:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | member | Budget summary: items, categories, totals, balances, simplified debts |
| POST | `/items` | editor | Add budget item |
| PATCH | `/items/:id` | editor | Update budget item |
| DELETE | `/items/:id` | editor | Delete budget item + cascade splits |
| POST | `/items/:id/splits` | editor | Set per-member splits |
| PATCH | `/items/:id/splits/:userId` | editor | Toggle isPaid |
| POST | `/settle` | editor | Record settlement |
| GET | `/settlements` | member | List settlements |

Debt simplification: greedy algorithm matching largest creditor with largest debtor.
Multi-currency: Frankfurt API with 1-hour in-memory cache (`lib/exchange.ts`).

### C.2 Packing Routes (`apps/api/src/routes/packing.ts`)

Mounted at `/api/v1/trips/:tripId/packing`. 18 endpoints covering items, categories, bags, and template operations.

### C.3 Admin Packing Templates (`apps/api/src/routes/admin-packing.ts`)

Admin CRUD at `/api/v1/admin/packing-templates` + public browse at `/api/v1/packing-templates`.

### C.4 Exchange Rate Helper (`apps/api/src/lib/exchange.ts`)

Frankfurt API: `https://api.frankfurter.app/latest?from={base}`, 1-hour in-memory cache.

---

## Part D: Types and SDK

- `packages/types/src/schemas/budget.ts` — BudgetItem, Split, Settlement, Summary schemas
- `packages/types/src/schemas/packing.ts` — PackingItem, Category, Bag, Template, List schemas
- `packages/sdk/src/hooks/budget.ts` — 8 hooks for budget operations
- `packages/sdk/src/hooks/packing.ts` — 15 hooks for packing operations

---

## Part E: Frontend

### Trip Detail Page — 3-tab bar
Updated `apps/web/src/app/(app)/trips/[tripId]/page.tsx` with tabs: Itinerary | Budget | Packing.

### Budget Tab (`components/trips/budget/budget-panel.tsx`)
- Grand total card with category breakdown
- Expandable category sections with items
- Balance summary with simplified debts
- Add expense modal, settlement modal
- Per-item split management with paid toggles

### Packing Tab (`components/trips/packing/packing-panel.tsx`)
- Progress bar (total/packed/percentage)
- Category-grouped checklist with checkbox toggles
- Bags panel with item counts
- Apply template and save-as-template modals
- Category assignee management

---

## Part F: Verification

See `docs/sprint-verification.md` for S5 smoke tests and demo walkthrough.

### Acceptance Criteria
- Add 10 budget items across 3 categories → totals correct, multi-currency converted
- Assign split amounts per person → per-person balance calculated correctly
- Record a settlement → balance updates and shows settled
- Apply packing template → items appear in correct categories
- Check an item → real-time update in other browser tab (WS)

---

## Part G: Git Commit and Push

All S5 changes committed and pushed to `DataSenseiAryan/roamera-v2` on `main` branch.
