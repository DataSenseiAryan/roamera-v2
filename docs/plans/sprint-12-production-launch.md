# Sprint 12 — Production Launch (Final MVP)

**Status:** ✅ Complete  
**Duration:** Week 24  
**Goal:** Feature consolidation (4 merges), 131+ passing tests, CI/CD pipeline, performance optimization, and full documentation update.

---

## Feature Consolidations

### Merge 1: JustSplit → Trip Budget
- **Removed**: `apps/api/src/routes/expenses.ts` route mount
- **Removed**: `apps/web/src/app/(app)/justsplit/` pages
- **Deprecated**: `packages/sdk/src/hooks/expenses.ts` (use `budget.ts`)
- **Updated**: `apps/mobile/app/circles/[circleId].tsx` — removed JustSplit summary section
- **Result**: All expense splitting is now trip-scoped at `/api/v1/trips/:tripId/budget`

### Merge 2: Chat Unification
- **Created**: `apps/api/src/lib/chat.ts` — shared chat utility functions (`tsIso`, `serializeUser`, `buildReactionMap`)
- **Created**: `apps/web/src/components/chat/ChatPanel.tsx` — shared React chat UI component
- **Refactored**: `apps/web/src/components/trips/collab/collab-panel.tsx` to use `ChatPanel`
- **Result**: Both trip collab and circle chat share implementation; both routers still mounted at original paths

### Merge 3: Atlas Stats → Gamification Stats
- **Updated**: `apps/api/src/routes/gamification.ts` — `GET /stats` now includes `countriesVisited`, `percentOfWorld`, `continentBreakdown`
- **Updated**: `apps/api/src/routes/atlas.ts` — `GET /stats` returns `Deprecation` header
- **Updated**: `packages/types/src/schemas/gamification.ts` — `TravelStatsSchema` extended
- **Deprecated**: `packages/sdk/src/hooks/atlas.ts` `useAtlasStats()` (use `useTravelStats()`)
- **Updated**: `apps/web/src/app/(app)/atlas/page.tsx` — uses `useTravelStats()`

### Merge 4: Journey Magazine → Trip Journal Tab
- **Created**: `apps/api/src/routes/trip-journal.ts` — 8 endpoints at `/api/v1/trips/:tripId/journal`
- **Added**: `GET /api/v1/journal/public/:token` — public read-only journal view
- **Migration**: `drizzle/0010_good_ultragirl.sql` — adds `tripId` FK to `journeys` table
- **Created**: `apps/web/src/components/trips/journal/journal-panel.tsx` — JournalPanel component
- **Updated**: `apps/web/src/app/(app)/trips/[tripId]/page.tsx` — "Journal" tab added (8th tab)
- **Deleted**: `apps/web/src/app/(app)/journeys/` — standalone pages removed
- **Removed**: `apps/web/src/components/navbar.tsx` — "Journey Magazine" nav link removed
- **Created**: `apps/web/src/app/journal/public/[token]/page.tsx` — public journal share page
- **Created**: `packages/sdk/src/hooks/trip-journal.ts` — 6 new hooks
- **Deprecated**: `packages/sdk/src/hooks/journeys.ts` (use `trip-journal.ts`)
- **Updated**: `apps/api/src/lib/badges.ts` — `first_journey` checks `journeys` with `tripId` set

---

## Testing

### Unit Tests (Vitest) — 131 tests, 20 files
| File | Tests | Purpose |
|------|-------|---------|
| `budget-groups.test.ts` | 7 | Trip budget CRUD, settlements, 404 for old expenses route |
| `chat.test.ts` | 11 | Collab + circle chat, messages, reactions, notes |
| `trip-journal.test.ts` | 10 | Journal entry CRUD, share/revoke, public access |
| `security.test.ts` | 10 | Auth guards, SQL injection safety, CORS, removed routes |
| `expenses.test.ts` | 3 | Verifies `/api/v1/expenses/*` returns 404 |
| `journeys.test.ts` | 3 | Verifies `/api/v1/journeys` returns 404 |
| `gamification.test.ts` | extended | New atlas fields in stats |

### E2E Tests (Playwright)
- `apps/web/e2e/auth.spec.ts` — login, logout, register, invalid credentials
- `apps/web/e2e/posts.spec.ts` — feed, create post, post detail
- `apps/web/e2e/trips-journal.spec.ts` — trips, create trip, Journal tab, navbar check
- `apps/web/e2e/ai.spec.ts` — AI planner, TravelLens, Atlas
- Config: `apps/web/playwright.config.ts`
- Script: `"test:e2e": "playwright test"` in `apps/web/package.json`

### Load Test
- Script: `apps/api/src/load-test.ts`
- Target: `GET /api/v1/feed/compass`, 100 concurrent, 30s, p95 < 200ms
- Script: `"load-test": "tsx src/load-test.ts"` in `apps/api/package.json`

---

## CI/CD

- `.github/workflows/ci.yml` with 4 jobs:
  1. `api-tests` — Vitest (Node 22, pnpm 9)
  2. `ai-tests` — pytest (Python 3.12)
  3. `web-build` — Next.js typecheck + build
  4. `docker-build` — builds API + AI service Docker images
- `docker-compose.yml` updated with `env_file: required: false` and configurable ports

---

## Performance

- `sharp` added to `apps/web` — enables Next.js WebP image optimization
- `apps/api/src/db/client.ts` — `applyDbPragmas()` sets WAL mode, 64MB cache, NORMAL sync, MEMORY temp store
- `apps/api/src/index.ts` — `applyDbPragmas()` called at server startup

---

## Documentation Updates

- `docs/architecture/08-build-roadmap.md` — S12 marked done, full as-built notes
- `docs/architecture/06-system-architecture.md` — §17 Testing Strategy, §18 Performance
- `docs/architecture/07-api-surface.md` — deprecated routes noted, new trip-journal section
- `docs/architecture/04-feature-matrix.md` — merged features noted with S12 decisions
- `docs/sprint-verification.md` — S12 acceptance criteria + smoke test scripts
- `README.md` — full V2 setup instructions, tech stack, S12 consolidations
- `docs/plans/sprint-12-production-launch.md` — this file
