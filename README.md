# Roamera V2 — Pack&Go

> You travel impromptu, cuz we plan.

A full-stack travel super-app: AI trip planner, social moments, trip collaboration, group expense splitting, journey magazine, and atlas.

---

## Monorepo Structure

```
fullstack-main/
├── apps/
│   ├── web/          Next.js 15 + shadcn/ui + Tailwind v3
│   ├── mobile/       Expo SDK 53 + Expo Router + NativeWind
│   ├── api/          Express 4 + Drizzle ORM + libSQL (Turso)
│   └── ai-service/   FastAPI + provider-agnostic AIClient
├── packages/
│   ├── types/        Zod schemas → inferred TypeScript types
│   ├── sdk/          axios client + TanStack Query hooks + WsClient
│   ├── ui/           Cross-platform Button, Card, Avatar, Input
│   └── config/       tsconfig, eslint, prettier, tailwind preset
├── legacy/           V1 archived — feature reference only, do not import
├── TREK_alt/         Read-only TREK reference codebase
├── docs/architecture/ Architecture deep-dives (01–08)
├── docker-compose.yml
└── AGENTS.md         AI agent context (read this first)
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 22  (`nvm use` — `.nvmrc` pins v22)
- pnpm ≥ 9  (`npm i -g pnpm`)
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

# 3. Create the SQLite database
cd apps/api && pnpm db:generate && pnpm db:migrate && cd ../..

# 4. Set up Python venv (ai-service)
cd apps/ai-service && python3 -m venv .venv && .venv/bin/pip install --no-cache-dir -r requirements.txt && cd ../..

# 5. Start all services
pnpm dev
```

Services start at:
- `http://localhost:3000` — Node API
- `http://localhost:3001` — Next.js web
- `http://localhost:8000` — FastAPI AI service
- `http://localhost:8081` — Expo mobile (Metro bundler)

### Verify

```bash
# API health
curl http://localhost:3000/api/health
# → {"status":"ok","db":"ok","version":"0.0.1","uptime_ms":...}

# Web health page
open http://localhost:3001/health

# AI service health
curl http://localhost:8000/health
# → {"status":"ok","provider":"gemini","service":"ai-service"}
```

---

## Development

```bash
pnpm lint        # lint all workspaces
pnpm typecheck   # typecheck all workspaces
pnpm build       # build all workspaces
pnpm test        # run tests (Vitest added in S2)
```

### Database (apps/api)

```bash
pnpm --filter @roamera/api db:generate  # generate migration from schema
pnpm --filter @roamera/api db:migrate   # apply migrations
pnpm --filter @roamera/api db:seed      # seed demo data (S1+)
pnpm --filter @roamera/api db:studio    # Drizzle Studio GUI
```

---

## Architecture

See [`AGENTS.md`](AGENTS.md) for a concise overview and [`docs/architecture/`](docs/architecture/) for deep dives.

Sprint roadmap: [`docs/architecture/08-build-roadmap.md`](docs/architecture/08-build-roadmap.md)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Node API | Express 4 · TypeScript · Drizzle ORM · libSQL/Turso · `ws` |
| AI Service | FastAPI · Pydantic · Gemini 2.0 Flash (provider-agnostic) |
| Web | Next.js 15 App Router · shadcn/ui · Tailwind v3 |
| Mobile | Expo 53 · Expo Router · NativeWind |
| Database | SQLite (local dev) → Turso (production) |
| Storage | `data/uploads/` (local dev) → Cloudflare R2 (production) |
| Auth | JWT + bcrypt + OTP email passwordless |
| Realtime | WebSocket (`ws`) with room subscriptions |

All services are free-tier or open-source. See `AGENTS.md §5` for the full stack rationale.
