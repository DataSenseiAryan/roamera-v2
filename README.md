# Roamera V2 — Pack&Go

> You travel impromptu, cuz we plan.

A full-stack travel super-app: AI trip planner, social Moments, trip collaboration, group budget tracking, trip journal, and atlas — built across 12 sprints as a complete MVP.

**Sprint status: S12 Production Launch ✅ — all sprints complete**

---

## Monorepo Structure

```
roamera-v2/
├── apps/
│   ├── web/          Next.js 15 + shadcn/ui + Tailwind v3
│   ├── mobile/       Expo SDK 53 + Expo Router + NativeWind
│   ├── api/          Express 4 + Drizzle ORM + libSQL (Turso)
│   └── ai-service/   FastAPI + provider-agnostic AIClient (Gemini default)
├── packages/
│   ├── types/        Zod schemas → inferred TypeScript types
│   ├── sdk/          axios client + TanStack Query hooks + WsClient
│   ├── ui/           Cross-platform Button, Card, Avatar, Input
│   └── config/       tsconfig, eslint, prettier, tailwind preset
├── legacy/           V1 archived — feature reference only, do not import
├── TREK_alt/         Read-only TREK reference codebase
├── docs/
│   ├── architecture/ Architecture deep-dives (01–08)
│   ├── sprint-verification.md  Per-sprint smoke test scripts + acceptance criteria
│   └── plans/        Sprint implementation plans
├── docker-compose.yml
├── .github/workflows/ci.yml  GitHub Actions CI (4 jobs)
└── AGENTS.md         AI agent context — read this first before any code changes
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 22 (`nvm use` — `.nvmrc` pins v22)
- pnpm ≥ 9 (`npm i -g pnpm`)
- Python 3.12+ (for ai-service)

### Setup

```bash
# 1. Install Node dependencies (all workspaces)
pnpm install

# 2. Set up environment files
cp apps/api/.env.example apps/api/.env
cp apps/ai-service/.env.example apps/ai-service/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env

# Edit apps/api/.env — set JWT_SECRET (min 32 chars)
# Edit apps/ai-service/.env — set GEMINI_API_KEY

# 3. Create and seed the SQLite database
pnpm --filter @roamera/api db:generate
pnpm --filter @roamera/api db:migrate
pnpm --filter @roamera/api db:seed   # creates 5 demo users + 30 destinations

# 4. Set up Python venv (ai-service)
cd apps/ai-service && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && cd ../..

# 5. Start all services (Turborepo parallel dev)
pnpm dev
```

Services start at:
- `http://localhost:4000` — Node API
- `http://localhost:3001` — Next.js web
- `http://localhost:8000` — FastAPI AI service
- `http://localhost:8081` — Expo mobile (Metro bundler)

### Demo Accounts (after `db:seed`)

All passwords: `password123`

| Username | Email |
|----------|-------|
| arya_explorer | arya@demo.roamera.in |
| marco_travels | marco@demo.roamera.in |
| leo_backpacker | leo@demo.roamera.in |
| ana_nomad | ana@demo.roamera.in |
| kenji_wanders | kenji@demo.roamera.in |

### Verify

```bash
# API health
curl http://localhost:4000/api/health
# → {"status":"ok","db":"ok","version":"0.0.1","uptime_ms":...}

# AI service health
curl http://localhost:8000/health
# → {"status":"ok","provider":"gemini","service":"ai-service"}
```

---

## Development

```bash
pnpm lint                         # lint all workspaces
pnpm typecheck                    # typecheck all workspaces
pnpm build                        # build all workspaces
pnpm --filter @roamera/api test   # run 131 API unit tests (Vitest)
```

### Database (apps/api)

```bash
pnpm --filter @roamera/api db:generate  # generate migration from schema changes
pnpm --filter @roamera/api db:migrate   # apply pending migrations
pnpm --filter @roamera/api db:seed      # seed demo data
pnpm --filter @roamera/api db:studio    # open Drizzle Studio GUI
```

### E2E Tests (Playwright)

```bash
# Requires API on :4000 and Web on :3001
pnpm --filter @roamera/web test:e2e
```

### Load Test

```bash
# Requires API running; set AUTH_TOKEN from a logged-in session
API_URL=http://localhost:4000 AUTH_TOKEN=<token> pnpm --filter api load-test
```

---

## Production (Docker)

```bash
# Build and run API + AI service
docker-compose up --build

# API will be on port 4000, AI on 8000
# Data persisted in Docker volume: api_data
```

For web: deploy `apps/web` to Vercel (`vercel --prod`). Set `NEXT_PUBLIC_API_URL` to your API URL.

---

## Architecture

See [`AGENTS.md`](AGENTS.md) for a concise overview and [`docs/architecture/`](docs/architecture/) for deep dives.

| Doc | Contents |
|-----|---------|
| `01-roamera-existing.md` | V1 app deep dive (archived reference) |
| `02-trek-reference.md` | TREK patterns reference |
| `03-prd-vision.md` | Product vision and brand |
| `04-feature-matrix.md` | Feature decisions (Keep/Port/New/Defer) |
| `05-gaps-and-bugs.md` | Issues found in V1 |
| `06-system-architecture.md` | Full technical design (START HERE) |
| `07-api-surface.md` | All API endpoints + WebSocket events |
| `08-build-roadmap.md` | 12-sprint MVP plan (all complete) |

Sprint roadmap: [`docs/architecture/08-build-roadmap.md`](docs/architecture/08-build-roadmap.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Node API | Express 4 · TypeScript · Drizzle ORM · libSQL/Turso · `ws` |
| AI Service | FastAPI · Pydantic · Gemini 2.0 Flash (provider-agnostic) |
| Web | Next.js 15 App Router · shadcn/ui · Tailwind v3 · PWA |
| Mobile | Expo 53 · Expo Router · NativeWind · Dexie offline |
| Database | SQLite/WAL (local dev) → Turso (production) |
| Storage | `data/uploads/` (local dev) → Cloudflare R2 (production) |
| Auth | JWT + bcrypt + OTP email passwordless |
| Realtime | WebSocket (`ws`) with room subscriptions |
| Testing | Vitest (131 tests) + Playwright E2E + autocannon load |
| CI/CD | GitHub Actions — api-tests, ai-tests, web-build, docker-build |

All services are free-tier or open-source. Cost: $0/mo + ~$10/yr for domain.
See `AGENTS.md §5` for the full stack rationale and `docs/architecture/06-system-architecture.md §16` for upgrade paths.

---

## S12 Feature Consolidations

Merged in Sprint 12 to reduce duplication:

| Merged | Result |
|--------|--------|
| JustSplit `expenses.ts` | Deprecated → use `/api/v1/trips/:id/budget` |
| Trip Collab Chat + Circle Chat | Shared `lib/chat.ts` + `ChatPanel` component |
| Atlas Stats | Merged into `GET /api/v1/gamification/stats` |
| Journey Magazine | Absorbed into Trips as "Journal" tab (`/trips/:id/journal`) |
