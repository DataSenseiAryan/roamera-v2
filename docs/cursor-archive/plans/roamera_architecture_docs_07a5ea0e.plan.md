---
name: Roamera Architecture Docs
overview: Create an always-loaded `AGENTS.md` at repo root plus deep-dive architecture references in `docs/architecture/` so any future Cursor agent has full context on (1) the existing FULLSTACK-MAIN Roamera app, (2) the TREK_alt reference codebase, and (3) the Roamera.in PRD vision — before we finalize features and pick a build target.
todos:
  - id: agents_md
    content: Write AGENTS.md at repo root with project framing, brand/naming glossary, repo layout diagram, side-by-side stack comparison, feature matrix snapshot, conventions, open decisions
    status: completed
  - id: doc_roamera
    content: Write docs/architecture/01-roamera-existing.md (full route table, Prisma ER diagram, frontend/mobile pages, implemented features, seed data, env vars)
    status: completed
  - id: doc_trek
    content: Write docs/architecture/02-trek-reference.md (routes, SQLite schema, WebSocket events, MCP scopes/tools/resources, client architecture, services to study)
    status: completed
  - id: doc_prd
    content: Write docs/architecture/03-prd-vision.md (brand, reactions, all 13 screens, target stack, planned APIs, DTOs, design system)
    status: completed
  - id: doc_matrix
    content: Write docs/architecture/04-feature-matrix.md (cross-source feature comparison table for finalization round)
    status: completed
  - id: doc_gaps
    content: Write docs/architecture/05-gaps-and-bugs.md (concrete issues in existing Roamera code)
    status: completed
isProject: false
---

## Goal

Capture *everything* already built across the three sources into a single, agent-friendly knowledge base. **No code changes** in this plan — only docs. Build-target decision (greenfield `fusion/`, rebuild in place, or new monorepo) is deferred until after the feature list is finalized.

## Deliverable structure

```
AGENTS.md                              # always-on entry doc (concise)
docs/architecture/
  01-roamera-existing.md               # deep dive on FULLSTACK-MAIN
  02-trek-reference.md                 # deep dive on TREK_alt (reference codebase)
  03-prd-vision.md                     # deep dive on Roamera.in PRD
  04-feature-matrix.md                 # cross-source feature comparison
  05-gaps-and-bugs.md                  # known issues in current Roamera code
  diagrams/                            # mermaid sources extracted (optional)
```

## File-by-file content outline

### `AGENTS.md` (root, ~400 lines)
- Project framing: 3 sources we are blending (Roamera-existing, TREK-reference, Roamera-PRD-vision)
- Brand & naming glossary from PRD: Compass (home/feed), Moments (posts), Trails (stories), Miles (highlights), Vlog (reels); reaction icons ❤️ Love · 🔥 Epic · 🌍 Wander · 📍 Wanna go · 🤩 Amazing
- Repo layout diagram (mermaid) showing `backend/`, `frontend/`, `mobile/`, `TREK_alt/` (read-only reference), `fusion/` (empty placeholder), `Roamera.in.docx`
- Side-by-side tech-stack comparison: Roamera-existing vs TREK vs PRD-target
- One-screen feature matrix with checkmarks
- "Where to look" index pointing to each deep-dive doc
- Working conventions: read-only `TREK_alt/` (reference, don't edit); seed accounts; env vars; how to run backend/frontend/mobile
- Open decisions list (build target, naming finalization, tech stack pick) so the next session can resume

### `docs/architecture/01-roamera-existing.md`
- Architecture diagram (mermaid): browser/mobile → Express API → Prisma → Postgres; Cloudinary; Anthropic Claude; SerpAPI; Gmail SMTP
- Backend routes table — every endpoint from [backend/src/routes/](backend/src/routes/) with method, path, auth, request shape, response shape: `auth`, `journals`, `social`, `users`, `search`, `destinations`, `hotels`, `flights`, `meetways`, `aiPlanner`, `budget`, `packing`, `justsplit`
- Prisma ER diagram (mermaid) for [backend/prisma/schema.prisma](backend/prisma/schema.prisma): User, Journal, Like, Comment, Destination, Follow, BucketList, Notification, BudgetEntry, PackingList/Item, JustSplit*, Meetway*
- Frontend route map from [frontend/src/App.jsx](frontend/src/App.jsx) with what each page does and which APIs it hits — all 21 pages
- Mobile screen inventory from [mobile/src/navigation/AppNavigator.js](mobile/src/navigation/AppNavigator.js)
- Auth flow sequence diagram: register → email verify → login → JWT
- Implemented features by category (journals, social, AI planner, TravelLens, Meetways, JustSplit, budget, packing, search, onboarding, profile)
- Seed data and demo accounts (5 demo users from [backend/prisma/seed-all.js](backend/prisma/seed-all.js))
- Env vars and external services in use

### `docs/architecture/02-trek-reference.md`
- High-level diagram: SPA + WebSocket + MCP server + SQLite + uploads
- Routes inventory for all 30+ files in [TREK_alt/server/src/routes/](TREK_alt/server/src/routes/) with what each governs
- SQLite schema (all ~50 tables, baseline + migrations) grouped by domain: core (users, trips, days, places), addons (atlas, vacay, journey, collab), infra (oauth, mcp_tokens, idempotency, audit_log)
- WebSocket vocabulary: ~40 event types (`place:created`, `assignment:moved`, `collab:message:created`, etc.) and the room model
- MCP surface: 27 OAuth scopes, ~150 tools grouped (trips/places/days/budget/packing/atlas/vacay/journey/collab), 30 resources, prompts
- Client architecture: Zustand stores, repo + sync layers (Dexie offline DB, mutation queue with idempotency keys, tile prefetcher), i18n (15 locales with RTL), PWA/Workbox config
- Map stack: Leaflet vs Mapbox GL adapters, Google Places + OSM/Nominatim/Overpass
- Notable services to study/port: realtime collab, packing templates, route optimization, PDF export, journey magazine layout, atlas country tracking, vacay calendar
- Operational features: backups, audit log, OIDC SSO, TOTP MFA, OAuth 2.1, MCP rate limits, idempotency middleware

### `docs/architecture/03-prd-vision.md`
- Mission & motto: "Pack&Go — you travel impromptu, cuz we plan." / Roamera
- Brand naming, reaction set, design system (lively/card-first/rounded-2xl/teal+coral, light+dark, micro-interactions)
- All 13 core screens with full descriptions: Onboarding/OTP, Home/Discover (Compass), AI Planner (conversational with constraint chips, Refine/Shuffle/Optimize/Book), Marketplace, Travel Circles, Experiences & Events, Workations, Trip Detail (drag-reorder, map of POIs, weather, attachments), Expenses (UPI/PayTM/GPay), Stories, Travel Graph & Gamification (badges, leaderboards), Notifications, Profile
- Mobile additions from PRD: Journey screen with photos+tips+budget+route, auto-caption/auto-hashtag, "you wanna stay/explore" suggestions after 3 reels of same location
- Target tech stack: Next.js 15 App Router + shadcn/ui (web), Expo Router + tamagui/nativewind (mobile), TanStack Query + Zustand + Zod, Email OTP, WebSockets, PWA + Workbox, next-intl + i18next, Recharts/Visx, Framer Motion + Reanimated
- Planned API endpoints (`/v1/ai/plan`, `/v1/marketplace/listings`, `/v1/circles*`, `/v1/experiences`, `/v1/workations`, `/v1/expenses/groups`, `/v1/gamification/*`, `/v1/auth/otp/*`)
- Required DTOs: User, Trip, DayPlan, POI, Listing, Circle, Message, Poll, ExpenseGroup, Badge, TravelGraph
- Stretch goals: feature flags, error boundaries, simple admin
- Acceptance criteria from PRD

### `docs/architecture/04-feature-matrix.md`
- Master table cross-referencing every feature against the three sources. Rows = features (e.g. "Group expense splitting", "Drag-drop day planner", "Real-time chat", "Email OTP", "Gamification badges", "Map with POI pins", "AI itinerary", "Stories/reels", "Marketplace", "Workations", "Bucket list", "Email verification", "PWA offline", "MCP server", "Multi-currency budget"). Columns = "In Roamera-existing?", "In TREK-reference?", "In PRD-vision?", with file/wiki citations.
- This is the document we will use to pick the final feature set in the next round.

### `docs/architecture/05-gaps-and-bugs.md`
Concrete issues found in current Roamera code worth tracking before we mix:
- `MeetwayDetail.jsx` Leave action calls a path the backend doesn't implement
- Reaction set divergence (PRD says ❤️ 🔥 🌍 📍 🤩; code uses `love`/`epic`/`wanna_go`)
- AI planner endpoint is unauthenticated (cost/abuse risk)
- Budget GET allows any logged-in user to read any journal's budget (privacy gap)
- Packing toggle endpoint doesn't verify journal ownership
- Dead code: `backend/src/lib/amadeus.js` and unused `openai` dep
- `SERPAPI_KEY` required but missing from `.env.example`
- `JournalCard` "AI Trip Planner" links to `/meetways` instead of `/ai-planner`
- Mobile `BucketListScreen` exists but isn't wired into navigator
- Seed users may need `emailVerified: true` patch for local dev login
- Meetways tag filter uses fragile substring match on stringified JSON

## What this plan does NOT do
- Does not write code or modify `backend/`, `frontend/`, `mobile/`, `TREK_alt/`, or `fusion/`
- Does not pick a tech stack for the rebuild
- Does not pick which features make the final cut

## Next session (after these docs are confirmed)
1. Walk through `docs/architecture/04-feature-matrix.md` together to mark each feature: keep / drop / port-from-trek / new-from-prd
2. Decide build target (the deferred question: `fusion/`, rebuild `frontend/`, or new monorepo)
3. Pick tech stack and start implementation