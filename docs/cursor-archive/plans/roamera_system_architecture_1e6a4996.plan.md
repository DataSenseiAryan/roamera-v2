---
name: Roamera System Architecture
overview: Document the full system architecture for the Roamera v2 build (hybrid Node API + FastAPI AI service, new monorepo, Next.js 15 web + Expo mobile) by writing three architecture specs in `docs/architecture/`, updating [AGENTS.md](AGENTS.md) with resolved decisions, and laying out a 12-sprint build roadmap. No code is written in this plan — that comes in the next plan after you approve this design.
todos:
  - id: doc_system_arch
    content: Write docs/architecture/06-system-architecture.md — full technical design with diagrams, service responsibilities, realtime architecture, domain modules, database strategy, deployment topology, security
    status: completed
  - id: doc_api_surface
    content: Write docs/architecture/07-api-surface.md — API endpoint catalog by module, V1→V2 migration mapping, FastAPI AI endpoints, WebSocket event reference
    status: completed
  - id: doc_roadmap
    content: Write docs/architecture/08-build-roadmap.md — 12-sprint MVP plan (24 weeks) with goals, deliverables, dependencies, acceptance criteria per sprint
    status: completed
  - id: update_agents_md
    content: Update AGENTS.md — resolve open decisions section, add new repo structure preview, add architecture-at-a-glance section, link to new docs
    status: completed
isProject: false
---

## Locked Architecture Decisions (Revised — Free, Public, Fully Managed)

> V1 code is **not reused**. All "Keep" matrix decisions mean rebuild fresh using TREK patterns or modern equivalents. V1 stays at `legacy/` for feature reference only.
> Stack maximally aligned with `TREK_alt/`.
> **No self-hosting.** Every runtime dependency is either OSS code we pull in OR a managed SaaS free tier with no infra to operate.
> **Cost target: $0/mo for MVP and small production usage; only domain (~$10/yr) is paid.**

| Decision | Choice | Cost | TREK alignment |
|----------|--------|------|----------------|
| Backend strategy | Hybrid: Node.js main API + FastAPI Python microservice for AI | $0 | TREK has no AI; we add FastAPI |
| Build target | New monorepo (apps/* + packages/*); archive V1 to `legacy/` | — | — |
| Web | Next.js 15 App Router + TypeScript + shadcn/ui + Tailwind 3 | OSS, $0 | TREK uses Vite; we deviate for SSR/SEO |
| Mobile | Expo SDK + Expo Router + NativeWind; builds via Expo prebuild + GitHub Actions free runners (no paid EAS) | OSS, $0 | New |
| Main API | Node.js + Express 4 + TS + Drizzle ORM | OSS, $0 | Matches TREK; adds Drizzle for type safety |
| **Database** | **Turso (managed libSQL / SQLite)** via `@libsql/client` + `drizzle-orm/libsql`; same client + Drizzle schema works locally (file mode) and in production (remote Turso) — single env var swap | Free tier: 500 DBs, 9 GB, 1 B reads/mo, 25 M writes/mo | TREK uses SQLite; we go managed |
| AI service | Python 3.12 + FastAPI + Pydantic + provider-agnostic `AIClient` | OSS, $0 | New (TREK has no AI) |
| AI provider — default | **Google Gemini 2.0 Flash** | Free 1500 req/day, no card | New |
| AI provider — backup | **Groq Cloud** (Llama 3.3 70B) | Free tier, no card | New |
| AI provider — optional | OpenAI / Anthropic via env switch | User-paid if desired | New |
| Realtime | `ws` library + ephemeral `ws_token` auth | OSS, $0 | TREK pattern |
| Map UI | Leaflet + react-leaflet | OSS, $0 | TREK pattern |
| Map tiles | OpenStreetMap public tiles (light traffic) → **Stadia Maps** free non-commercial / **MapTiler** 100 k/mo free for higher quality | Free tiers | TREK pattern |
| Geocoding | Nominatim (free, 1 req/sec) with server-side caching + Photon (Komoot, free) fallback | $0 | TREK pattern |
| Place details / POIs | Overpass API (OSM, free) + optional **Foursquare Places** (100 k calls/mo free) for ratings/photos | $0 | TREK pattern + enrichment |
| Weather | Open-Meteo (no key, no rate limit at our scale) | $0 | TREK pattern |
| Flights / hotels search | **Amadeus Self-Service** (2000 free calls/mo) for in-app prices + deep-links to Skyscanner / Google Flights / Booking.com / Kiwi for booking | $0 (replaces SerpAPI) | New |
| Cover images | Pexels API (200 req/hr free) + Unsplash (50 req/hr free, attribution) | $0 | New |
| **Object storage (uploads)** | **Cloudflare R2** (10 GB free, zero egress fees) primary; Backblaze B2 (10 GB free) backup; storage adapter abstracted by `STORAGE_DRIVER` env | $0 (within free tier) | Replaces TREK's local volume since we avoid self-hosting |
| Local dev storage | local `data/uploads/` volume via multer (only used when `STORAGE_DRIVER=local`) | $0 | TREK pattern |
| Email | **Resend** (3000 emails/mo free) primary; **Brevo** (300/day free) backup; Nodemailer + Gmail app password for dev | $0 | New (TREK uses Nodemailer; we keep Nodemailer abstraction but with managed SMTP/HTTP API providers) |
| Auth | JWT + bcrypt + email verify + Email OTP + password reset (sprint 1); OAuth 2.1 + OIDC + TOTP MFA deferred | OSS libs, $0 | TREK pattern |
| Validation | Zod (TS) + Pydantic (Python) | OSS, $0 | TREK pattern |
| State | TanStack Query + Zustand | OSS, $0 | TREK pattern |
| Offline | Dexie (IndexedDB) + mutation queue + idempotency keys | OSS, $0 | TREK pattern |
| PWA | Workbox via `next-pwa` | OSS, $0 | TREK pattern |
| i18n | next-intl (web) + i18next (mobile) | OSS, $0 | TREK has 15 locales |
| Background jobs | node-cron + node-schedule (in-process); for scheduled cross-service jobs use Cloudflare Cron Triggers free or GitHub Actions scheduled workflows | OSS + free | TREK pattern |
| MCP server | `@modelcontextprotocol/sdk` | OSS, $0 | TREK pattern |
| Monorepo | pnpm + Turborepo | OSS, $0 | — |
| Logging | pino (Node) + structlog (Python) → console; ship to **Better Stack Logs** free tier (1 GB / 3 days retention) or **Axiom** free tier (0.5 GB/mo) for searchable logs | OSS + free | New |
| Error tracking | **Sentry Cloud free tier** (5k errors/mo, 10k performance units, 1 user) | $0 | New |
| Analytics | **PostHog Cloud free** (1 M events/mo) primary; **Vercel Web Analytics** (basic, included free) for web auto-pageviews | $0 | New |
| Uptime monitoring | **UptimeRobot** (50 monitors free, 5-min interval) | $0 | New |
| CI | GitHub Actions (2000 min/mo free private; unlimited for public repos) | $0 | — |
| Deploy — web | **Vercel Hobby** (free for non-commercial; perfect for Next.js 15) | $0 | — |
| Deploy — API + AI service | Platform-agnostic Dockerfiles + env vars (decide host at deploy time). Recommended free options when ready: **Fly.io** (3 shared VMs, WebSocket, persistent volumes) or **Railway** ($5/mo free credit, simpler UX). Render free tier rejected (spins down, breaks WebSocket). | $0 | TREK is single Docker; we follow |
| Deploy — DB | Turso managed (no infra) | $0 | — |
| Deploy — uploads | Cloudflare R2 managed (no infra) | $0 | — |
| Domain + DNS | Cloudflare DNS (free); your registrar; Cloudflare Tunnel optional if ever self-hosting | ~$10/yr domain | — |

---

## Free, Public, Managed-Only Stack Principles

These rules govern every dependency choice in the build:

1. **Default to OSS with permissive license** (MIT, Apache 2.0, BSD, ISC) for libraries we ship in our code.
2. **All hosted services must be managed free tiers.** No self-hosting (no VPS, no Docker on someone else's box, no Ollama, no MinIO, no Umami self-host, no GlitchTip self-host). The user runs no infra.
3. **No paid SaaS in the critical path.** Every chosen managed service must have a free tier with limits comfortably above MVP traffic.
4. **No vendor lock-in.** Storage, AI provider, email, analytics, error tracking are all behind interfaces — swap by changing env vars. Drizzle schema is portable to Postgres day-1 if we ever leave Turso.
5. **Free APIs preferred even at lower quality** — OSM/Nominatim/Overpass/Open-Meteo before any paid map/places/weather provider; deep-links before paid travel APIs.
6. **Free-tier with API keys is OK** when limits exceed expected MVP traffic (Gemini 1500/day, Turso 1 B reads/mo, R2 10 GB, Foursquare 100 k/mo, Amadeus 2000/mo, Pexels 200/hr, Sentry 5k/mo, PostHog 1 M/mo, Resend 3000/mo).
7. **Pay-as-you-grow upgrades documented** — each free piece has a documented swap when it stops scaling (Gemini → OpenAI/Anthropic; OSM tiles → MapTiler; Turso free → Turso paid or Neon Postgres; Vercel Hobby → Pro; R2 free → paid; Sentry free → paid).
8. **Public datasets only** for any seed content (OSM, Wikidata, Wikipedia, public-domain photos).
9. **Platform-agnostic deploys** — every service is a plain Dockerfile + env vars; no platform-specific lock-in (no Vercel-only edge functions in API; no Cloudflare Workers; no Railway-only features). Deploy target can change without rewriting code.

---

## Target Repo Structure

```
fullstack-main/                       (existing repo root)
├── apps/
│   ├── web/                          Next.js 15
│   ├── mobile/                       Expo
│   ├── api/                          Node + Express 4 + TS + Drizzle + @libsql/client (Turso)
│   └── ai-service/                   Python 3.12 + FastAPI + Pydantic
├── packages/
│   ├── ui/                           Shared components (NativeWind-compatible primitives)
│   ├── types/                        Zod schemas + TS types shared across apps
│   ├── sdk/                          Typed API client + TanStack Query hooks
│   └── config/                       tsconfig / eslint / prettier / tailwind preset
├── legacy/                           V1 archived (backend/ + frontend/ + mobile/)
├── TREK_alt/                         Read-only reference (unchanged)
├── docs/architecture/                (existing + 3 new files)
├── data/                             Local-only: dev libSQL file + dev uploads (gitignored). Production uses Turso + R2.
├── docker-compose.yml                Local dev (api + ai-service); local libSQL file mode; no DB container
├── turbo.json
├── pnpm-workspace.yaml
├── AGENTS.md
└── README.md
```

---

## Deliverables (4 files)

### 1. `docs/architecture/06-system-architecture.md`

Full technical design:

- **High-level architecture diagram** (mermaid) — browser/mobile → Node API → SQLite + FastAPI AI + external services
- **Service responsibilities** — what lives in Node API vs FastAPI vs frontend; design rationale for each module
- **Service-to-service auth** — how Node API authenticates calls to FastAPI (HMAC-signed envelope with user context propagation)
- **Realtime architecture** — WebSocket auth via short-lived `ws_token` (TREK pattern), room model (per-trip, per-circle, per-user), event categories (trip:*, circle:*, chat:*, poll:*, notification:*), reconnect + offline replay flow
- **Domain modules in Node API** (modular monolith): auth, users, posts (Moments), social, feed, meetways (Circles), expenses (JustSplit), trips (full planner), budget, packing, journey (magazine), atlas, gamification, travellens, destinations, maps, weather, notifications, admin, mcp
- **Database strategy** — Drizzle ORM + libSQL/SQLite via `@libsql/client`. Local dev: file mode at `data/app.db` (no infra). Production: Turso managed (one connection string change). Same schema, same migrations, same Drizzle code. Backup: Turso provides automated backups on free tier; we also export nightly via `turso db dump` to GitHub Actions artifact. Growth path: Turso free → Turso Scaler ($29/mo) → Postgres (Neon/Supabase) by swapping `drizzle-orm/libsql` → `drizzle-orm/postgres-js` (≈1-day port since Drizzle schema is dialect-portable).
- **Schema design preview** — table groups: identity (users, sessions, otp_tokens), social (posts, reactions, comments, follows, bucket_list), feed (notifications, notification_prefs), trips (trips, days, places, assignments, day_notes, reservations, accommodations, trip_members, trip_files), packing (lists, items, bags, templates), budget (items, splits, settlements), circles (circles, members, messages, polls, votes), journey (journeys, entries, photos, contributors), atlas (visited_countries, regions, badges), media (uploads with reference counting)
- **Photo + file storage** — `STORAGE_DRIVER` abstraction with two implementations: `local` (multer to `data/uploads/`, used for dev only) and `r2` (Cloudflare R2 via S3-compatible API, used in production — 10 GB free, zero egress fees). Content-addressed naming (sha256.ext), sharp for thumbnails, signed-URL gated downloads. Backblaze B2 swap via env. No self-hosted MinIO.
- **External integrations (all free / free-tier, all managed)**:
  - **Travel search**: Amadeus Self-Service (2000 free calls/mo) for flights + hotels in-app prices; deep-links to Skyscanner / Google Flights / Booking.com / Kiwi for booking — no SerpAPI
  - **AI**: provider-agnostic in FastAPI; default Gemini 2.0 Flash (1500/day free, no card), backup Groq (free tier), optional OpenAI/Anthropic via env switch
  - **Weather**: Open-Meteo (no key, no rate limit at our scale)
  - **Geocoding**: Nominatim (1 req/sec) + Photon fallback; server-side cache to stay within etiquette
  - **Places / POIs**: Overpass API (OSM); optional Foursquare Places (100k/mo free) for richer ratings/photos
  - **Cover images**: Pexels API (200/hr free) + Unsplash (50/hr free, attribution)
  - **Email**: Resend HTTP API (3000/mo free) primary; Brevo SMTP (300/day free) backup; Nodemailer abstraction so we can swap
  - **Logs**: Better Stack Logs free (1 GB / 3 days) or Axiom free (0.5 GB/mo) for production log search
  - **Error tracking**: Sentry Cloud free (5k errors/mo)
  - **Analytics**: PostHog Cloud free (1 M events/mo) + Vercel Web Analytics (built-in)
  - **Uptime**: UptimeRobot free (50 monitors)
- **AI provider abstraction** (in FastAPI) — `AIClient` interface with implementations for Gemini, Groq, OpenAI, Anthropic; selected by `AI_PROVIDER` env; standardizes prompt + response format; retry + fallback chain (e.g. Gemini → Groq if upstream errors); LangChain optional for future RAG
- **Free, fully-managed deployment topology** — Vercel Hobby (web) + Fly.io or Railway free tier (api + ai-service as 2 plain Docker services) + Turso (DB, managed) + Cloudflare R2 (uploads, managed) + Cloudflare DNS + Sentry/PostHog/UptimeRobot/Resend/Better-Stack as managed observability. Total run cost: $0/mo + ~$10/yr for a domain. Zero infra to operate.
- **Shared packages contract** — `types` (Zod schemas + TS types), `sdk` (typed REST client + TanStack Query hooks generated from types), `ui` (cross-platform primitives that work in Next.js + Expo via NativeWind), `config` (tsconfig/eslint/prettier/tailwind preset)
- **Deployment topology** (mermaid) — Vercel (web) + single VPS or Fly.io (Node API + FastAPI as 2 containers, sharing volume for SQLite + uploads), Cloudflare R2 optional for uploads at scale
- **Local dev** — `docker-compose.yml` runs api + ai-service; SQLite is just a file in `data/app.db` (no DB container needed); `pnpm dev` runs Next.js + Expo + api + ai via Turborepo
- **Observability** — health checks (`/api/health`), structured logging (pino on Node, structlog on Python), audit log table for admin actions, optional Sentry hook
- **Security** — rate limiting (express-rate-limit), CORS, helmet, input validation (Zod + Pydantic), no secrets in code, HMAC for service-to-service, ephemeral tokens for WebSocket and asset access, idempotency middleware (TREK pattern)
- **No-V1-code rule** — design assumes the schema, route handlers, and components are written from scratch; V1 patterns may be referenced for shape but not copied; TREK patterns preferred where applicable

### 2. `docs/architecture/07-api-surface.md`

API endpoint catalog organized by module. Not every endpoint listed exhaustively — rather:

- For each domain module, the **route prefix**, **representative endpoints**, **auth requirements**, **request/response Zod schema name**
- All endpoints versioned under `/v1/`
- Mapping table: V1 endpoint → V2 equivalent (reference only — V2 routes are written fresh, not lifted)
- TREK pattern endpoints we are porting (auth, idempotency, ws_token, exports, health, MCP) — direct mapping from `TREK_alt/server/server.js`
- FastAPI AI service endpoints (`POST /v1/ai/plan`, `POST /v1/ai/optimize-budget`, `POST /v1/ai/caption`, `POST /v1/ai/hashtag`, `POST /v1/ai/translate`) — internal HTTP only, HMAC-signed, called by Node API
- WebSocket event reference — full event list with Zod schema for each payload, room subscription rules, error events, reconnect contract

### 3. `docs/architecture/08-build-roadmap.md`

12-sprint MVP plan (24 weeks total estimate):

- **Sprint 0** (Week 1): Monorepo bootstrap, pnpm + Turborepo, CI, Docker Compose (api + ai), Drizzle schema design (fresh, not ported), design system tokens (shadcn + NativeWind), archive V1 to `legacy/`
- **Sprint 1** (Weeks 2-3): Auth (register, login, JWT, email verify, OTP, password reset), users, profile
- **Sprint 2** (Weeks 4-5): Posts (Moments), reactions (5 types incl. Wander/Amazing), comments, bucket list, feed (public+following), search
- **Sprint 3** (Weeks 6-7): AI Trip Planner (FastAPI service, Gemini default) + conversational UI, TravelLens (Amadeus free tier + Skyscanner/Google Flights deep-links, no SerpAPI)
- **Sprint 4** (Weeks 8-10): Trip Planner (TREK port) — days, places, assignments, drag-drop, Leaflet maps, weather, geocoding
- **Sprint 5** (Weeks 11-12): Per-trip budget tracker (with splits), packing lists (with templates, bags, assignees)
- **Sprint 6** (Weeks 13-14): Meetways/Circles + realtime chat + polls + linked expense group
- **Sprint 7** (Weeks 15-16): JustSplit (multi-currency, weighted splits), debt simplification
- **Sprint 8** (Weeks 17-18): Journey magazine, Atlas (visited countries), gamification (badges, stats, leaderboards)
- **Sprint 9** (Weeks 19-20): Notifications (WebSocket push + interactive + email + per-type prefs), admin panel, audit log, backups, rate limiting
- **Sprint 10** (Weeks 21-22): Reservations + files + share/invite links + ICS/PDF export + PWA (Workbox) + i18n (15 langs)
- **Sprint 11** (Week 23): MCP server (AI tools API), mobile app polish (Expo migration)
- **Sprint 12** (Week 24): End-to-end polish, performance, deploy to production, cutover from V1

Each sprint section in the roadmap includes: goal, deliverable list, dependencies, acceptance criteria.

### 4. `AGENTS.md` updates

- Section 7 "Open Decisions" → mark all 7 decisions as resolved with chosen answer
- Section 8 "Where to look" → add entries for the 3 new docs
- Section 3 "Repo Layout" → add new monorepo structure preview
- New section: "Architecture at a glance" — 5-line summary of the chosen architecture for any future agent

---

## What this plan does NOT do

- Does **not** bootstrap the monorepo (no `pnpm init`, no `apps/web` scaffold yet)
- Does **not** move V1 code to `legacy/`
- Does **not** write any application code
- Does **not** install dependencies
- Does **not** modify `backend/`, `frontend/`, `mobile/`, `TREK_alt/`, or `fusion/`

These will be the next plan (Phase B), after you review and approve this architectural design.

---

## Next plan (Phase B, after this is approved)

1. Bootstrap monorepo: `pnpm init`, `turbo.json`, `pnpm-workspace.yaml`
2. Move V1 to `legacy/` (archive `backend/`, `frontend/`, `mobile/`, delete empty `fusion/`); add a `legacy/README.md` clarifying it is reference-only and not to be imported from
3. Scaffold `apps/web` (Next.js 15 App Router + shadcn/ui + Tailwind 3 + next-intl + next-pwa)
4. Scaffold `apps/mobile` (Expo SDK + Expo Router + NativeWind + i18next)
5. Scaffold `apps/api` (Express 4 + TS + `@libsql/client` + Drizzle (`drizzle-orm/libsql`) + ws + helmet + cors + multer + otplib + node-cron + pino + AWS S3 client for R2)
6. Scaffold `apps/ai-service` (FastAPI + Pydantic + provider-agnostic AI client, default Gemini)
7. Scaffold `packages/types` (Zod), `packages/sdk` (typed client + TanStack Query hooks), `packages/ui` (cross-platform primitives), `packages/config` (tsconfig/eslint/prettier/tailwind preset)
8. Author Drizzle schema in `apps/api/src/db/schema.ts` (fresh design, not lifted from V1)
9. Set up `docker-compose.yml` (api + ai-service for local dev; libSQL runs in file mode in `data/app.db`, no DB container needed)
10. Set up GitHub Actions CI (lint, typecheck, test, build)
11. Run Sprint 1 (auth module: register / login / JWT / email verify / OTP / password reset)