---
name: Sprint 10 Reservations Files PWA i18n
overview: Sprint 10 delivers trip reservations, accommodations, file attachments with R2 storage, ICS/PDF export, PWA installability with offline caching, and 5-locale i18n — completing the final feature set before the MCP/mobile sprint. A comprehensive test suite update runs at the end.
todos:
  - id: s10-debt-audit
    content: Mark S8 SDK hook checkboxes as [x] in roadmap (doc fix only)
    status: completed
  - id: s10-install-deps
    content: Install ical-generator, pdfmake, @serwist/next, serwist
    status: completed
  - id: s10-reservations-backend
    content: Add reservations CRUD (4 endpoints) + accommodations CRUD (4 endpoints) to trips.ts
    status: completed
  - id: s10-files-backend
    content: Create apps/api/src/routes/trip-files.ts with 7 endpoints (upload, list, star, trash, restore, delete, share, download)
    status: completed
  - id: s10-ics-pdf-bundle
    content: Improve ICS export (ical-generator), add PDF export endpoint (pdfmake), add /:tripId/bundle offline payload endpoint
    status: completed
  - id: s10-invites-backend
    content: Create apps/api/src/routes/invites.ts (create/validate/register with invite token)
    status: completed
  - id: s10-types-sdk
    content: Create packages/types/src/schemas/reservations.ts and packages/sdk/src/hooks/reservations.ts with all hooks, update exports
    status: completed
  - id: s10-web-trip-detail
    content: Add Reservations, Accommodations, Files tabs to trips/[tripId]/page.tsx with create/edit/delete UI
    status: completed
  - id: s10-web-exports
    content: Add ICS and PDF export buttons on trip header
    status: completed
  - id: s10-pwa
    content: Install @serwist/next, configure next.config.ts, add manifest.ts, offline/page.tsx, service worker cache strategies
    status: completed
  - id: s10-i18n
    content: Configure next-intl routing (5 locales), create messages/*.json files, update middleware, add locale switcher to settings
    status: completed
  - id: s10-tests
    content: Write reservations.test.ts and files.test.ts for API; update test count in docs
    status: completed
  - id: s10-doc-updates
    content: Update roadmap, API surface doc, sprint-verification.md, AGENTS.md, save plan, commit+push
    status: in_progress
  - id: s10-demo
    content: Start all services (API + AI + Web) for live demo
    status: pending
isProject: false
---

# Sprint 10 — Reservations, Files, Export, PWA & i18n

## S1–S9 Debt Audit

| Sprint | Open Item | Action |
|--------|-----------|--------|
| S4 | Offline bundle (`/:tripId/bundle`) deferred | Build in S10 |
| S8 | Types/SDK checkboxes (`useJourneysQuery`, `useAtlasQuery`, `useBadgesQuery`) show `[ ]` in roadmap but code exists | Doc fix only — mark `[x]` |
| S5–S9 | All mobile-deferred screens | Correctly deferred to S11 — no action |

---

## What Already Exists (do not re-build)

- Schema tables: `reservations`, `accommodations`, `trip_files`, `invite_tokens` — all present in [`apps/api/src/db/schema.ts`](apps/api/src/db/schema.ts)
- Basic ICS export: `GET /:tripId/export/ics` already in [`apps/api/src/routes/trips.ts`](apps/api/src/routes/trips.ts) (line 989)
- `next-intl` already installed in `apps/web/package.json`
- `@aws-sdk/client-s3`, `multer`, `sharp` already in API deps

---

## Part A — Backend

### A1. Install Missing Dependencies

```bash
pnpm add ical-generator pdfmake @types/pdfmake --filter api
```

### A2. Reservations Router

Extend [`apps/api/src/routes/trips.ts`](apps/api/src/routes/trips.ts) with 4 endpoints:

- `GET /:tripId/reservations` — list all, ordered by `startTime`, auth
- `POST /:tripId/reservations` — create (`type`, `name`, `dayId`, `startTime`, `endTime`, `confirmation`, `notes`)
- `PATCH /:tripId/reservations/:id` — update fields
- `DELETE /:tripId/reservations/:id` — delete

All require authenticated trip member (viewer can read, editor+ can write).

### A3. Accommodations Router

In same `trips.ts`, 4 endpoints:

- `GET /:tripId/accommodations` — list, auth
- `POST /:tripId/accommodations` — create (`placeId`, `checkinDayId`, `checkoutDayId`, `checkinTime`, `checkoutTime`, `confirmation`, `notes`)
- `PATCH /:tripId/accommodations/:id` — update
- `DELETE /:tripId/accommodations/:id` — delete

### A4. Trip Files Router

New file [`apps/api/src/routes/trip-files.ts`](apps/api/src/routes/trip-files.ts) mounted at `/:tripId` inside trips router:

- `GET /files` — list non-trashed files
- `POST /files` — multipart upload → multer → `uploadFile()` → insert `trip_files` row
- `PATCH /files/:id` — `isStarred` toggle, rename
- `DELETE /files/:id` — soft-trash (`isTrashed = true`)
- `DELETE /files/:id/permanent` — hard delete (owner only) + remove from storage
- `GET /files/:id/download` — generate presigned GET URL (10-min TTL) or local URL
- `POST /files/:id/share` — set/regenerate `shareToken`, return public download URL

Register in `trips.ts`: `router.use('/:tripId', tripFilesRouter);`

### A5. ICS Export — Validate and Improve

Replace the hand-rolled ICS string at line 1049 of `trips.ts` with `ical-generator`. Adds proper:
- `VTIMEZONE` block
- `LOCATION` field from `places`
- `DESCRIPTION` from day notes
- `STATUS:CONFIRMED` on reserved events

### A6. PDF Export

New endpoint in `trips.ts`:

- `GET /:tripId/export/pdf` — uses `pdfmake` to build a structured PDF
  - Header: trip title, dates, cover thumbnail
  - Per-day sections: places, reservations, notes
  - Returns buffer as `application/pdf` attachment

### A7. Offline Bundle

- `GET /:tripId/bundle` — returns a single JSON payload with: trip, days, places, assignments, reservations, accommodations, members, packing lists
- Used by web service worker and mobile Dexie sync

### A8. Invite Tokens

New [`apps/api/src/routes/invites.ts`](apps/api/src/routes/invites.ts):

- `POST /api/v1/invites` — admin creates invite token (expires, max uses)
- `GET /api/v1/invites/:token` — public; validate token, return metadata
- `POST /api/v1/auth/register-invite` — register with valid invite token

Register in [`apps/api/src/routes/index.ts`](apps/api/src/routes/index.ts).

---

## Part B — Web (Next.js)

### B1. Trip Detail — Reservations Tab

New tab on [`apps/web/src/app/(app)/trips/[tripId]/page.tsx`](apps/web/src/app/(app)/trips/[tripId]/page.tsx):
- Grouped by day with `create / edit / delete` modals
- Type badge (flight ✈, hotel 🏨, restaurant 🍽, other)

### B2. Trip Detail — Accommodations Tab

Inline on same page:
- Spans check-in/check-out day range with card UI

### B3. Trip Detail — Files Panel

New tab:
- File list with star / trash icons
- Upload button → `POST /:tripId/files`
- Image files show thumbnail (using `sharp`-generated `_thumb.webp` key)
- Download → fetches presigned URL from `GET /files/:id/download`, opens in new tab
- Share → copies public share URL from `POST /files/:id/share`

### B4. Export Buttons

On trip header:
- `Export ICS` button → triggers `GET /:tripId/export/ics`, browser downloads
- `Export PDF` button → triggers `GET /:tripId/export/pdf`, browser downloads

### B5. PWA

Install `@serwist/next` (actively maintained workbox fork, replaces deprecated `next-pwa`):

```bash
pnpm add @serwist/next serwist --filter web
```

- Create `apps/web/public/sw.js` entry and `apps/web/src/app/manifest.ts` (Web App Manifest)
- `next.config.ts` — wrap with `withSerwist({ swSrc, swDest, ... })`
- Cache strategy: `StaleWhileRevalidate` for `/api/v1/feed/*` and `/api/v1/trips/*`
- New `apps/web/src/app/offline/page.tsx` — offline fallback shown when navigation fails

### B6. i18n with next-intl

`next-intl` is already installed. Wire up:

- `apps/web/src/i18n/` directory with `routing.ts` (5 locales: `en`, `hi`, `fr`, `es`, `de`; default: `en`)
- `apps/web/messages/en.json`, `hi.json`, `fr.json`, `es.json`, `de.json` — extract all static UI labels from key pages (navbar, home, trips, settings)
- `apps/web/src/middleware.ts` — update to include `createNavigation` from `next-intl/routing`
- Locale switcher dropdown in `apps/web/src/app/(app)/settings/page.tsx`

> **Scope**: all labels in navbar, settings, error pages, and trip detail page. Content (trip names, post bodies) stays in user locale.

### B7. Offline Fallback Page

`apps/web/src/app/offline/page.tsx` — simple page shown when SW intercepts a failed navigation while offline.

---

## Part C — Types & SDK

### C1. New Schemas — [`packages/types/src/schemas/reservations.ts`](packages/types/src/schemas/reservations.ts)

- `ReservationSchema` (id, tripId, dayId, type, name, startTime, endTime, confirmation, notes)
- `AccommodationSchema`
- `TripFileSchema` (id, tripId, filename, mimeType, sizeBytes, isStarred, isTrashed, shareToken)

Export from [`packages/types/src/index.ts`](packages/types/src/index.ts).

### C2. New Hooks — [`packages/sdk/src/hooks/reservations.ts`](packages/sdk/src/hooks/reservations.ts)

- `useReservations(tripId)`, `useCreateReservation()`, `useUpdateReservation()`, `useDeleteReservation()`
- `useAccommodations(tripId)`, `useCreateAccommodation()`, `useUpdateAccommodation()`, `useDeleteAccommodation()`
- `useTripFiles(tripId)`, `useUploadTripFile()`, `useUpdateTripFile()`, `useDeleteTripFile()`, `useShareTripFile()`

Export from [`packages/sdk/src/index.ts`](packages/sdk/src/index.ts).

---

## Part D — Tests

### D1. New API Test Files

Add to `apps/api/src/__tests__/`:

| File | Key assertions |
|------|----------------|
| `reservations.test.ts` | Create → 201, list → array, update → 200, delete → 204 |
| `files.test.ts` | Upload → 201, list → array, star → 200, trash → 200, download URL → 200, share → 200 |

> Both run inside the existing sequential vitest config (no changes needed to `vitest.config.ts`).

### D2. AI Service Test — ICS smoke

Add `test_ics.py` to `apps/ai-service/tests/` — basic check that `GET /api/v1/trips/:id/export/ics` (via the API) returns `text/calendar`. (This is an integration-level test hit via the test database.)

> Total after S10: ~80 API tests + 14 AI tests.

---

## Part E — Documentation & Git

- Mark S8 SDK hook checkboxes as `[x]` in [`docs/architecture/08-build-roadmap.md`](docs/architecture/08-build-roadmap.md)
- Add S10 as `[x] Done` with deliverables and as-built notes
- Update [`docs/architecture/07-api-surface.md`](docs/architecture/07-api-surface.md) §5.6–5.11 with `✅ Implemented (S10)`
- Add S10 smoke tests + acceptance criteria to [`docs/sprint-verification.md`](docs/sprint-verification.md)
- Save plan to `docs/plans/sprint-10-reservations-files-pwa-i18n.md`
- Update `AGENTS.md` with S10 as-built notes
- Commit `feat: sprint 10 - reservations, files, ICS/PDF export, PWA, i18n` and push
- Start all services (API + AI + Web) for live demo

---

## Files Changed Summary

**API:** `trips.ts` (add reservations/accommodations/ICS/PDF/bundle), `trip-files.ts` (new), `invites.ts` (new), `routes/index.ts`

**Types/SDK:** `schemas/reservations.ts` (new), `hooks/reservations.ts` (new), `index.ts` (both)

**Web:** `trips/[tripId]/page.tsx` (tabs), `settings/page.tsx` (locale switcher), `offline/page.tsx` (new), `manifest.ts` (new), `middleware.ts` (i18n), `next.config.ts` (PWA), `i18n/routing.ts` (new), `messages/*.json` (5 files)

**Tests:** `reservations.test.ts` (new), `files.test.ts` (new)

**Docs:** `08-build-roadmap.md`, `07-api-surface.md`, `sprint-verification.md`, `AGENTS.md`, `docs/plans/sprint-10-*.md` (new)
