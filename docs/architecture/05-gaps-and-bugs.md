# 05 — Gaps & Bugs in Roamera V1

> Concrete issues found in the existing `backend/` + `frontend/` + `mobile/` codebase.
> Fix these before building new features on top of them — or document that they are
> intentionally deferred/replaced in the next build.
>
> Severity: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

---

## Bug #1 — MeetwayDetail "Leave" Calls Wrong Endpoint

**Severity:** 🟠 High
**Status:** Unfixed in V1

**File:** `frontend/src/pages/MeetwayDetail.jsx`
**Problem:** The "Leave meetway" action on the web frontend calls:
```
DELETE /api/meetways/:id/participants/:userId
```
But the backend implements:
```
DELETE /api/meetways/:id/leave      ← correct endpoint
PATCH  /api/meetways/:id/participants/:userId  ← this exists but is for approve/decline (PATCH not DELETE)
```
The web leave action will return **404** in production.

**Fix:** Change the frontend call to `DELETE /api/meetways/:id/leave`.
The mobile app (`mobile/src/screens/MeetwayDetailScreen.js`) already uses the correct endpoint.

**Files to change:**
- `frontend/src/pages/MeetwayDetail.jsx` — find leave action, fix endpoint

---

## Bug #2 — AI Planner Endpoint Has No Auth Guard

**Severity:** 🔴 Critical
**Status:** Unfixed

**File:** `backend/src/routes/aiPlanner.js`
**Problem:** `POST /api/ai-planner/generate` has **no authentication middleware**.
Any unauthenticated user (or bot) can call this endpoint and consume the `ANTHROPIC_API_KEY` quota.
At Claude Sonnet pricing this can be expensive.

**Fix options:**
1. Add `authenticate` middleware to the route
2. Add rate limiting per IP (express-rate-limit)
3. Both

**Files to change:**
- `backend/src/routes/aiPlanner.js` — add `authenticate` import and middleware

---

## Bug #3 — Budget GET Leaks Data Across Users

**Severity:** 🟠 High
**Status:** Unfixed

**File:** `backend/src/routes/budget.js`
**Problem:** `GET /api/journals/:journalId/budget` returns the full budget breakdown for **any authenticated user**, not just the journal owner. There is no ownership check on the GET route.

**Fix:** Add ownership check: verify `journal.userId === req.userId` before returning data.

**Files to change:**
- `backend/src/routes/budget.js` — add `journal.userId !== req.userId → 403` guard on GET

---

## Bug #4 — Packing Toggle Has No Ownership Check

**Severity:** 🟡 Medium
**Status:** Unfixed

**File:** `backend/src/routes/packing.js`
**Problem:** `PATCH /api/journals/:journalId/packing/:listId/items/:itemId/toggle` marks an item as packed/unpacked for **any authenticated user**, even if they don't own the journal.

**Fix:** Add ownership check on the toggle endpoint.

**Files to change:**
- `backend/src/routes/packing.js` — add ownership guard on PATCH toggle

---

## Bug #5 — JournalCard "AI Trip Planner" Links to Wrong Route

**Severity:** 🟢 Low
**Status:** Unfixed

**File:** `frontend/src/components/JournalCard.jsx`
**Problem:** The action menu on a journal card includes an "AI Trip Planner" option but it navigates to `/meetways` instead of `/ai-planner`.

**Fix:** Change the route target.

**Files to change:**
- `frontend/src/components/JournalCard.jsx` — fix navigation target

---

## Bug #6 — Mobile BucketListScreen Exists but is Not Wired

**Severity:** 🟢 Low
**Status:** Unfixed

**File:** `mobile/src/screens/BucketListScreen.js` + `mobile/src/navigation/AppNavigator.js`
**Problem:** The screen file exists but is never imported or registered in `AppNavigator.js`. Users on mobile cannot access their bucket list.

**Fix:** Import `BucketListScreen` and add it as a stack screen or as a tab in `AppNavigator.js`. On web, bucket list is accessible via the Profile page's tab.

**Files to change:**
- `mobile/src/navigation/AppNavigator.js` — add `BucketListScreen` import + stack screen registration

---

## Gap #7 — Seed Users Not Email-Verified by Default

**Severity:** 🟠 High (blocks local development)
**Status:** Known workaround needed

**File:** `backend/prisma/seed-all.js`
**Problem:** The seed script creates demo users (marco_travels, leo_backpacker, etc.) but does not explicitly set `emailVerified: true`. Since the `User.emailVerified` field defaults to `false` in `schema.prisma`, all demo users may require email verification before login — but no email is sent in local dev (SMTP usually not configured).

**Fix options:**
1. Update seed script to include `emailVerified: true` for demo users
2. After seeding, manually set via Prisma Studio: `npx prisma studio` → Users → set `emailVerified = true`
3. Alternatively, temporarily set up a dev bypass in auth route when `NODE_ENV=development`

**Files to change:**
- `backend/prisma/seed-all.js` — add `emailVerified: true` to user creates

---

## Gap #8 — SERPAPI_KEY Missing from `.env.example`

**Severity:** 🟡 Medium
**Status:** Documentation gap

**File:** `backend/.env.example`
**Problem:** `SERPAPI_KEY` is **required** by `backend/src/routes/hotels.js` and `backend/src/routes/flights.js` but is not listed in `.env.example`. New developers setting up the project won't know they need it for TravelLens to work.

**Fix:** Add `SERPAPI_KEY=` to `.env.example` with a comment.

**Files to change:**
- `backend/.env.example` — add `SERPAPI_KEY=your_serpapi_key` entry

---

## Gap #9 — Dead Code: amadeus.js and openai Package

**Severity:** 🟢 Low
**Status:** Technical debt

**Files:**
- `backend/src/lib/amadeus.js` — Amadeus flight API client, fully written, but **never imported** by any route
- `backend/package.json` — lists `"openai": "^6.33.0"` dependency but **no file in `backend/src/` imports it**

**Fix:** Remove the unused dependency and delete (or archive) `amadeus.js`.

**Files to change:**
- `backend/package.json` — remove `openai` from dependencies
- `backend/src/lib/amadeus.js` — delete or move to archive

---

## Gap #10 — Meetways Tag Filter is Fragile

**Severity:** 🟡 Medium
**Status:** Technical debt

**File:** `backend/src/routes/meetways.js`
**Problem:** The `?tag=` filter on `GET /api/meetways` uses a SQL `LIKE` / Prisma `contains` check on the raw stringified JSON array stored in `Meetway.tags`. For example, a meetway with tag `"mountain"` stored as `["mountain","adventure"]` → JSON string `["mountain","adventure"]`. A `contains: "mountain"` search works. But a tag named `"mount"` would also match `"mountain"`. This is fragile if tag names have substring relationships.

**Fix options:**
1. Parse tags to a normalized junction table (Meetway ↔ Tag)
2. Use PostgreSQL JSON array operators (`@>`) via Prisma raw query
3. Accept the limitation as low-priority for V1 (tags are controlled strings)

---

## Gap #11 — RAPIDAPI_KEY and FRONTEND_URL Referenced but Unused

**Severity:** 🟢 Low
**Status:** Confusing documentation

**Files:** `backend/.env.example`, `backend/.env`
**Problem:**
- `RAPIDAPI_KEY` is in `.env.example` (seems to reference a Skyscanner API) but **no route in `backend/src/` uses it**.
- `FRONTEND_URL` is in both `.env.example` and `.env` but the backend code uses `APP_URL` for email links, not `FRONTEND_URL`.

**Fix:** Remove from `.env.example` or add a comment explaining they are unused.

---

## Gap #12 — Mobile App Hardcodes Production API URL

**Severity:** 🟡 Medium
**Status:** Developer experience issue

**File:** `mobile/src/lib/api.js`
**Problem:** The `BASE_URL` is hardcoded to `https://roamera.in/api`. Local development requires manually editing this file to point to `http://192.168.x.x:3001/api` (device IP).

**Fix:** Use `__DEV__` flag from React Native:
```javascript
const BASE_URL = __DEV__
  ? 'http://192.168.1.x:3001/api'   // update IP
  : 'https://roamera.in/api';
```
Or use a `.env` + `react-native-dotenv` / `react-native-config` for proper env management.

---

## Gap #13 — No WebSocket / Real-time Support

**Severity:** 🟠 High (critical for PRD vision)
**Status:** Missing feature

**Problem:** The entire V1 app uses REST polling for all "live" features:
- Meetways chat: no live updates, user must refresh
- Notifications: no push, only badge count on load
- No collaborative features

**Impact:** This is a fundamental architectural gap vs TREK and vs PRD requirements.

**Resolution:** Must be built in next iteration. TREK's WebSocket implementation (`TREK_alt/server/src/websocket.ts`) is a good reference.

---

## Gap #14 — No Password Reset Flow

**Severity:** 🟠 High
**Status:** Missing feature (TREK has it)

**Problem:** V1 backend has no `POST /api/auth/forgot-password` or `POST /api/auth/reset-password` endpoints. Users who forget their password cannot self-serve reset. Only the database admin can update password hashes directly.

**Fix:** Implement forgot-password flow (send email with token → token validates → allow new password set). TREK's `auth.ts` + `authService.ts` has a reference implementation with proper token hashing.

---

## Gap #15 — Reaction Set Mismatch with PRD

**Severity:** 🟡 Medium
**Status:** Design decision needed

**Problem:** 
- V1 implements: `love`, `epic`, `wanna_go`
- PRD specifies: ❤️ Love, 🔥 Epic, 🌍 Wander, 📍 Wanna Go, 🤩 Amazing

The PRD adds two new reaction types (`wander`, `amazing`). The DB schema (`Like.type` as String with `@@unique([userId, journalId, type])`) supports adding new types without migration. The frontend just needs new UI buttons.

**What `wanna_go` does (keep this behavior):** Adds journal to `BucketList` table.
**What `wander` and `amazing` should do:** Notification only (no bucket list save) — matches existing `love`/`epic` behavior.

**Fix:** Add `wander` and `amazing` reaction types to frontend. No backend schema change needed.

---

## Gap #16 — JustSplit Default Currency is USD, App is INR-Focused

**Severity:** 🟡 Medium
**Status:** Inconsistency

**File:** `backend/prisma/schema.prisma`
**Problem:** `JustSplitGroup.currency` defaults to `"USD"` but the app is marketed for India (₹ INR everywhere else). The budget tracker uses INR hardcoded. JustSplit should default to `"INR"`.

**Fix:** Change default in schema and re-run `npx prisma db push`.

---

## Gap #17 — No Rate Limiting on Any Endpoint

**Severity:** 🟠 High
**Status:** Missing infrastructure

**Problem:** There is no rate limiting anywhere in `backend/src/`. This means:
- The unauthenticated AI planner endpoint (#2 above) is especially exposed
- Auth endpoints (register, login) are vulnerable to brute force
- Any SerpAPI-calling endpoint could be cost-exploited

**Fix:** Add `express-rate-limit` with appropriate limits:
- Auth endpoints: 10 req/15min per IP
- AI planner: 5 req/hour per IP (or per user if auth added)
- General API: 300 req/min per user/IP

---

## Gap #18 — No Error Boundaries on Frontend

**Severity:** 🟢 Low
**Status:** UX gap

**Problem:** The React frontend has no error boundaries. A runtime error in any component will crash the entire app to a blank screen with a console error. There is no "Something went wrong" recovery UI.

**Fix:** Add `ErrorBoundary` components at the page level and around critical components (feed, planner, expense views).

---

## Summary Table

| # | Issue | File(s) | Severity | Type |
|---|-------|---------|----------|------|
| 1 | MeetwayDetail leave calls wrong endpoint | `frontend/src/pages/MeetwayDetail.jsx` | 🟠 High | Bug |
| 2 | AI planner endpoint unauthenticated | `backend/src/routes/aiPlanner.js` | 🔴 Critical | Security |
| 3 | Budget GET leaks data to any user | `backend/src/routes/budget.js` | 🟠 High | Security |
| 4 | Packing toggle no ownership check | `backend/src/routes/packing.js` | 🟡 Medium | Security |
| 5 | JournalCard links to wrong route | `frontend/src/components/JournalCard.jsx` | 🟢 Low | Bug |
| 6 | Mobile BucketListScreen not wired | `mobile/src/navigation/AppNavigator.js` | 🟢 Low | Gap |
| 7 | Seed users not email-verified | `backend/prisma/seed-all.js` | 🟠 High | DX |
| 8 | SERPAPI_KEY missing from .env.example | `backend/.env.example` | 🟡 Medium | Docs |
| 9 | Dead code: amadeus.js + openai dep | `backend/src/lib/amadeus.js`, `package.json` | 🟢 Low | Debt |
| 10 | Meetways tag filter is fragile | `backend/src/routes/meetways.js` | 🟡 Medium | Reliability |
| 11 | RAPIDAPI_KEY + FRONTEND_URL unused | `backend/.env.example` | 🟢 Low | Docs |
| 12 | Mobile hardcodes production API URL | `mobile/src/lib/api.js` | 🟡 Medium | DX |
| 13 | No WebSocket / realtime | All | 🟠 High | Gap |
| 14 | No password reset flow | `backend/src/routes/auth.js` | 🟠 High | Gap |
| 15 | Reaction set mismatch with PRD | Frontend + Backend | 🟡 Medium | Design |
| 16 | JustSplit defaults to USD not INR | `backend/prisma/schema.prisma` | 🟡 Medium | Design |
| 17 | No rate limiting | `backend/src/` | 🟠 High | Security |
| 18 | No error boundaries | `frontend/src/` | 🟢 Low | UX |
