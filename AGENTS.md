# AGENTS.md — Roamera V2 Project Context

> This file is always loaded by every Cursor agent working in this repository.
> Read it first before making any changes. It tells you what exists, what is planned,
> and where to find deep-dive reference docs.

---

## 1. What This Repo Is

**Roamera** is a travel super-app (web + mobile). We are building V2 from scratch by blending
the feature set of the existing Roamera V1 and the TREK reference codebase, guided by the PRD vision.

| Source | Location | Role |
|--------|----------|------|
| **Roamera V1** | `legacy/` | **Feature reference only — do not import from this directory.** Archived original codebase. |
| **TREK reference** | `TREK_alt/` | **Read-only.** (AGPL) Open-source travel planner — study patterns, do not modify or import. |
| **PRD vision** | `Roamera.in.docx` / `Roamera.in.txt` / `docs/architecture/03-prd-vision.md` | Product roadmap and feature vision |
| **V2 build** | `apps/` + `packages/` | Where all new code lives |

### Critical rules for every agent
1. **Never import from `legacy/`** — it is feature reference, not a code library.
2. **Never modify `TREK_alt/`** — it is a read-only reference (AGPL licensed).
3. **No V1 patterns** — the old codebase used Prisma + Postgres + Cloudinary + Anthropic SDK. V2 uses Drizzle + libSQL (Turso) + Cloudflare R2 + Gemini (default). Do not reintroduce V1 choices.
4. **Free stack only** — every dependency must be OSS or a managed free-tier SaaS. See `docs/architecture/06-system-architecture.md §15` for the no-V1-code rule and upgrade paths.
5. **Do not commit secrets** — use `.env` (gitignored) for all keys.

---

## 2. Architecture at a Glance

**Stack:**
- Web: Next.js 15 App Router + TypeScript + shadcn/ui + Tailwind 3 + next-intl + PWA
- Mobile: Expo SDK + Expo Router + NativeWind + i18next
- API: Node.js + Express 4 + TypeScript + Drizzle ORM + `@libsql/client` (Turso SQLite) + `ws` (WebSocket)
- AI: Python 3.12 + FastAPI + Pydantic — provider-agnostic AIClient (default: Gemini 2.0 Flash free)
- Monorepo: pnpm + Turborepo
- DB: Turso (managed libSQL/SQLite) — local file mode in dev, remote URL in prod
- Storage: Cloudflare R2 (10 GB free, zero egress) — local disk in dev
- Email: Resend (3000/mo free)
- Deploy: Vercel (web) + PaaS TBD (API + AI) — plain Dockerfiles, decide at deploy time
- All runtime services: free-tier managed (Turso, R2, Resend, Sentry, PostHog, UptimeRobot)
- Cost: $0/mo + ~$10/yr for a domain

**Architecture diagram:** `docs/architecture/06-system-architecture.md §1`

---

## 3. Repo Layout

```
fullstack-main/
├── AGENTS.md                    ← you are here (always-loaded context)
├── README.md
│
├── apps/
│   ├── web/                     Next.js 15 App Router (Vercel)
│   ├── mobile/                  Expo SDK + Expo Router
│   ├── api/                     Node + Express 4 + TS + Drizzle + @libsql/client + ws
│   └── ai-service/              Python 3.12 + FastAPI + Pydantic
│
├── packages/
│   ├── types/                   Zod schemas + inferred TS types (source of truth)
│   ├── sdk/                     Typed REST client + TanStack Query hooks + WsClient
│   ├── ui/                      Cross-platform component primitives
│   └── config/                  tsconfig / eslint / prettier / tailwind preset
│
├── legacy/                      V1 archived — DO NOT IMPORT
│   ├── README.md                "feature reference only — do not import"
│   ├── backend/                 (old Node + Prisma + Postgres)
│   ├── frontend/                (old React 19 + Vite)
│   └── mobile/                  (old React Native 0.72 bare)
│
├── TREK_alt/                    Read-only reference (AGPL) — DO NOT MODIFY
│
├── data/                        LOCAL ONLY — dev SQLite file + dev uploads (gitignored)
├── docker-compose.yml           Local dev: api + ai-service
├── turbo.json
├── pnpm-workspace.yaml
│
└── docs/
    └── architecture/
        ├── 01-roamera-existing.md   V1 app deep dive (routes, schema, pages)
        ├── 02-trek-reference.md     TREK routes, schema, WebSocket, MCP
        ├── 03-prd-vision.md         Product vision (screens, stack, brand)
        ├── 04-feature-matrix.md     Cross-source feature comparison + decisions
        ├── 05-gaps-and-bugs.md      Issues found in V1 codebase
        ├── 06-system-architecture.md  ← V2 full technical design (START HERE)
        ├── 07-api-surface.md        All API endpoints + WebSocket events
        └── 08-build-roadmap.md      12-sprint MVP plan (24 weeks)
```

---

## 4. Brand & Naming Glossary

| Generic concept | Roamera brand name | Notes |
|----------------|--------------------|-------|
| Feed / Home | **Compass** 🧭 | Main discovery screen |
| Post / Share | **Moments** 📸 | Travel posts with 3–5 images |
| Story | **Trails** 🛤️ | Short-form stories (deferred to post-MVP) |
| Highlight reel | **Miles** 🪙 | Curated highlights (deferred) |
| Reel / Video | **Vlog** 🎬 | Video content (deferred) |
| Save / Bookmark | **Wanna Go** 📍 | Reaction type + bucket list add |
| People you may know | **Fellow Travelers** | Social discovery (deferred) |
| Group meetup | **Circle** / **Meetways** | Group travel coordination |

### Reaction set (all 5 must be implemented)

| Emoji | Label | DB key | Behavior |
|-------|-------|--------|----------|
| ❤️ | Love | `love` | Standard like |
| 🔥 | Epic | `epic` | High-energy endorsement |
| 🌍 | Wander | `wander` | Inspiration to explore |
| 📍 | Wanna Go | `wanna_go` | Saves to user bucket list |
| 🤩 | Amazing | `amazing` | Discovery delight |

### Design tokens

| Token | Value |
|-------|-------|
| Primary | Teal `#0D9488` |
| Accent | Coral / warm orange |
| Radius | `rounded-2xl` (16px) |
| Dark mode | Full support (`dark:` classes) |

---

## 5. Resolved Architecture Decisions

All open decisions from the planning phase are now locked:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Build target | New monorepo `apps/` + `packages/` | Fresh start, no V1 code |
| Web framework | Next.js 15 App Router | SSR for SEO of public posts/profiles |
| Mobile | Expo Router + NativeWind | Modern, file-based, cross-platform |
| API runtime | Node.js + Express 4 + TypeScript | TREK-aligned |
| Database | SQLite via Turso + Drizzle ORM | $0, managed, TREK-aligned, portable to Postgres |
| DB driver | `@libsql/client` + `drizzle-orm/libsql` | Works in file mode (dev) + remote (prod) |
| AI provider | Gemini 2.0 Flash (default, 1500/day free) | Free, multimodal; Groq backup; OpenAI/Anthropic optional |
| AI architecture | Separate FastAPI Python microservice | Python ecosystem for future LangChain/RAG |
| Auth strategy | JWT + bcrypt + email verify + Email OTP | TREK-aligned; OIDC/TOTP deferred |
| Realtime | `ws` library + ephemeral `ws_token` | TREK pattern exactly |
| Maps | Leaflet + react-leaflet + OSM tiles | Free, TREK-aligned |
| Storage | Cloudflare R2 (prod) / local multer (dev) | 10 GB free, zero egress |
| Email | Resend HTTP API | 3000/mo free, no SMTP server |
| Flight/hotel search | Amadeus Self-Service (2000/mo free) + deep-links | Replaces SerpAPI (was paid $50/mo) |
| Offline | Dexie + mutation queue + idempotency keys | TREK pattern |
| PWA | Workbox via next-pwa | TREK pattern |
| i18n | next-intl (web) + i18next (mobile) | TREK has 15 locales; start with 5 |
| Monorepo | pnpm + Turborepo | Industry standard |
| Error tracking | Sentry Cloud free (5k/mo) | Managed, no self-hosting |
| Analytics | PostHog Cloud free (1M events/mo) | Managed, no self-hosting |
| Deploy | Vercel (web) + PaaS TBD (API+AI) — plain Dockerfiles | Platform-agnostic |

---

## 6. Tech Stack — Side-by-Side (V1 vs V2)

| Layer | V1 (legacy) | V2 (build target) |
|-------|-------------|-------------------|
| Web framework | React 19 + Vite | **Next.js 15 App Router + TS** |
| UI library | Tailwind v4 + lucide | **shadcn/ui + Tailwind 3** |
| State | React Context | **Zustand + TanStack Query** |
| Validation | None | **Zod (TS) + Pydantic (Python)** |
| Mobile | React Native 0.72 (bare) | **Expo Router + NativeWind** |
| Backend | Node + Express 5 | **Node + Express 4 + TS** |
| Database | PostgreSQL + Prisma | **SQLite (Turso) + Drizzle ORM** |
| Auth | JWT + bcrypt | **JWT + bcrypt + Email OTP** |
| Realtime | None (polling) | **WebSocket (ws) + ws_token** |
| AI | Anthropic Claude SDK | **FastAPI + Gemini 2.0 Flash (default)** |
| Travel search | SerpAPI (paid) | **Amadeus free + deep-links** |
| Maps | None | **Leaflet + OSM + Nominatim** |
| File storage | Cloudinary | **Cloudflare R2 + multer (dev)** |
| Email | Nodemailer + Gmail SMTP | **Resend HTTP API** |
| Offline | None | **Dexie + mutation queue** |
| PWA | None | **Workbox + next-pwa** |
| i18n | None | **next-intl + i18next (5 locales)** |
| MCP server | None | **@modelcontextprotocol/sdk + OAuth 2.1** |
| Monorepo | None | **pnpm + Turborepo** |

---

## 7. Feature Matrix Snapshot

Full matrix with all decisions filled in: `docs/architecture/04-feature-matrix.md`

| Feature | Decision | Sprint |
|---------|----------|--------|
| Email/password auth + JWT | Build fresh (TREK pattern) | S1 |
| Email OTP (passwordless) | Build fresh | S1 |
| Password reset, account delete, session management | Port (TREK pattern) | S1 |
| Follow/unfollow, user search, profile | Build fresh | S1 |
| Moments (posts, photos, rich text, itinerary) | Build fresh | S2 |
| All 5 reactions (love, epic, wander, wanna_go, amazing) | Build fresh | S2 |
| Comments (nested), feed (global + following), search | Build fresh | S2 |
| AI trip planner (conversational) | New (FastAPI + Gemini) | S3 |
| TravelLens (Amadeus + deep-links, no SerpAPI) | New | S3 |
| Trip planner (days, places, drag-drop, maps, weather) | Port (TREK pattern) | S4 |
| Real-time collaboration (WebSocket, TREK pattern) | Port | S4 |
| Budget tracker with member splits | Port (TREK pattern) | S5 |
| Packing lists (bags, templates, assignees) | Port (TREK pattern) | S5 |
| Circles / Meetways (group travel, chat, polls) | Build fresh | S6 |
| JustSplit (multi-currency, weighted, debt simplification) | Build fresh | S7 |
| Journey magazine (rich content, contributors, share) | Port (TREK pattern) | S8 |
| Atlas (visited countries map, regions, stats) | Port (TREK pattern) | S8 |
| Gamification (badges, stats, leaderboard) | New | S8 |
| Notifications (real-time, interactive, per-prefs) | Port (TREK pattern, enhanced) | S9 |
| Admin panel (users, audit log, notices, stats) | Port (TREK pattern) | S9 |
| Reservations + trip files + ICS/PDF export | Port (TREK pattern) | S10 |
| PWA (offline, installable) | Port (TREK/Workbox pattern) | S10 |
| i18n 5 locales | Port (TREK pattern) | S10 |
| MCP server (AI assistant tools, OAuth 2.1) | Port (TREK pattern) | S11 |
| Expo mobile + push notifications | New | S11 |
| Trails, Vlogs, Marketplace, Experiences | **Deferred post-MVP** | — |
| OIDC SSO, TOTP 2FA | **Deferred** | — |
| Phone OTP (SMS) | **Deferred** | — |

---

## 8. Working Conventions

### Starting a new sprint
```bash
pnpm install                          # install all workspace deps
pnpm dev                              # Turborepo: web + api + ai-service

# API database
pnpm --filter api db:migrate          # apply pending Drizzle migrations
pnpm --filter api db:seed             # optional: seed demo data
```

### Adding a new API endpoint
1. Add Zod schema to `packages/types/src/schemas/<module>.ts`
2. Add route handler in `apps/api/src/routes/<module>.ts`
3. Register route in `apps/api/src/app.ts`
4. Add typed SDK hook in `packages/sdk/src/hooks/<module>.ts`
5. Use the hook in `apps/web` or `apps/mobile`

### Database changes
```bash
# Edit apps/api/src/db/schema.ts
pnpm --filter api db:generate         # generate migration SQL
pnpm --filter api db:migrate          # apply to local dev DB
# Commit both schema.ts + generated migration file
```

### WebSocket events
- Issue a `ws_token` first: `GET /api/v1/auth/ws-token`
- Connect: `wss://<host>/ws?token=<ws_token>`
- Subscribe to rooms: `{ type: "subscribe", rooms: ["trip:42"] }`
- Full event catalog: `docs/architecture/07-api-surface.md §21`

### Demo accounts (after running seed)
All password: `password123`

| Username | Email |
|----------|-------|
| arya_explorer | arya@demo.roamera.in |
| marco_travels | marco@demo.roamera.in |
| leo_backpacker | leo@demo.roamera.in |
| ana_nomad | ana@demo.roamera.in |
| kenji_wanders | kenji@demo.roamera.in |

---

## 9. Where to Look

| Question | File to read |
|----------|-------------|
| What is the overall V2 architecture? | `docs/architecture/06-system-architecture.md` |
| What are all the API endpoints? | `docs/architecture/07-api-surface.md` |
| What is the WebSocket protocol? | `docs/architecture/07-api-surface.md §21` |
| What is the DB schema? | `docs/architecture/06-system-architecture.md §4.2` |
| What sprint am I in? What's next? | `docs/architecture/08-build-roadmap.md` |
| What was implemented in past sprints? | `docs/plans/` (sprint implementation details) |
| How to verify a sprint works? | `docs/sprint-verification.md` |
| What tech did V1 use? | `docs/architecture/01-roamera-existing.md` |
| What patterns does TREK use? | `docs/architecture/02-trek-reference.md` |
| What is the product vision / screens? | `docs/architecture/03-prd-vision.md` |
| Which features are deferred? | `docs/architecture/04-feature-matrix.md` (Defer rows) |
| What bugs existed in V1? | `docs/architecture/05-gaps-and-bugs.md` |
| What services / accounts are needed? | `docs/architecture/06-system-architecture.md §11` |
| How does the AI service work? | `docs/architecture/06-system-architecture.md §10` |
| How does file storage work? | `docs/architecture/06-system-architecture.md §6` |
| What are the free-stack principles? | `docs/architecture/06-system-architecture.md` (stack table) |
| What are the upgrade paths when free tiers run out? | `docs/architecture/06-system-architecture.md §16` |

---

## 10. Sprint Implementation Status

| Sprint | Plan | Status |
|--------|------|--------|
| S0 | Foundation | ✅ Done |
| S1 | Auth & Profile | ✅ Done — see `docs/plans/sprint-1-auth-profile.md` |
| S2 | Moments & Social | ✅ Done — see `docs/plans/sprint-2-moments-social.md` |
| S3 | AI Planner + TravelLens | ✅ Done — see `docs/plans/sprint-3-ai-travellens.md` |
| S4+ | Trip Planner, Budget, Circles... | 🔜 Upcoming |

**Current as-built notes:**
- WebSocket: server boots and issues `ws_token`, room subscriptions deferred to S4
- idempotency middleware: wired (S3 debt fix)
- Public profiles: optionally authenticated (S3 debt fix)
- AI service: Gemini primary + Groq fallback; requires `GOOGLE_API_KEY` or `GROQ_API_KEY` in `.env`
- Amadeus: requires `AMADEUS_CLIENT_ID` + `AMADEUS_CLIENT_SECRET`; gracefully degrades to deep-links only
