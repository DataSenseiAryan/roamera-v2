---
name: Phase B Monorepo Bootstrap
overview: "Execute Phase B (Sprint 0 — Foundation): archive V1 to legacy/, scaffold the new monorepo with 4 apps (web, mobile, api, ai-service) and 4 packages (types, sdk, ui, config), wire up Drizzle with full S1 schema + skeletons for later sprints, set up Docker Compose + GitHub Actions, and run all installs so `pnpm dev` works end-to-end."
todos:
  - id: cleanup
    content: Archive backend/, frontend/, mobile/ to legacy/; delete fusion/; remove old root package.json/lock; update .gitignore
    status: completed
  - id: monorepo_root
    content: Create pnpm-workspace.yaml, turbo.json, root package.json, .npmrc, .nvmrc
    status: completed
  - id: pkg_config
    content: Scaffold packages/config (tsconfig presets, eslint, prettier, tailwind preset with design tokens)
    status: completed
  - id: pkg_types
    content: Scaffold packages/types with Zod schemas for S1 (auth, users, follows, common)
    status: completed
  - id: pkg_sdk
    content: Scaffold packages/sdk (axios client, TanStack Query hooks for S1, WsClient with reconnect)
    status: completed
  - id: pkg_ui
    content: Scaffold packages/ui (cross-platform Button, Card, Avatar, Input)
    status: completed
  - id: app_api
    content: "Scaffold apps/api: Express 4 + TS + Drizzle + libSQL; full S1 schema + skeleton stubs for all later domain tables; /api/health; middleware stack; Dockerfile"
    status: completed
  - id: app_ai
    content: "Scaffold apps/ai-service: FastAPI + Pydantic; AIClient with Gemini implementation + provider stubs; HMAC middleware; endpoint stubs returning 501; Dockerfile"
    status: completed
  - id: app_web
    content: "Scaffold apps/web: Next.js 15 App Router + shadcn/ui + Tailwind preset + next-intl + next-pwa; landing + health page"
    status: completed
  - id: app_mobile
    content: "Scaffold apps/mobile: Expo Router + NativeWind + i18next; bottom tabs + auth stack placeholders + health screen"
    status: completed
  - id: docker_ci
    content: Write docker-compose.yml (api + ai-service); GitHub Actions CI workflow (Node + Python jobs)
    status: completed
  - id: install_run
    content: Run pnpm install (all workspaces) + pip install (ai-service) + expo prebuild; run db:generate + db:migrate
    status: completed
  - id: verify
    content: "Verify acceptance: pnpm typecheck + lint pass; pnpm dev starts all services; /api/health returns ok; web /health page renders API status"
    status: completed
isProject: false
---

# Phase B — Monorepo Bootstrap (Sprint 0)

Goal: a working monorepo skeleton you can `pnpm dev` from. No user-facing features yet — just the scaffold every later sprint builds on. Reference: [docs/architecture/08-build-roadmap.md](docs/architecture/08-build-roadmap.md) Sprint 0.

## 1. Cleanup & Archive

- Move `backend/` → `legacy/backend/`
- Move `frontend/` → `legacy/frontend/`
- Move `mobile/` → `legacy/mobile/`
- Create `legacy/README.md` stating "feature reference only — do not import from this directory"
- Delete `fusion/` (empty placeholder; has stale `node_modules/` from prior attempts)
- Delete root `package.json` and `package-lock.json` (V1 artifacts — will be replaced)
- Update root `.gitignore` to add `node_modules/`, `data/`, `.env`, `.next/`, `dist/`, `.turbo/`, `*.db`, `*.db-journal`, `.expo/`

## 2. Monorepo Root Files

- `pnpm-workspace.yaml` — workspaces: `apps/*`, `packages/*`
- Root `package.json` — name `roamera`, `private: true`, scripts: `dev`, `build`, `lint`, `typecheck`, `test` (all delegate to Turborepo)
- `turbo.json` — pipeline for `build`, `dev` (persistent, no cache), `lint`, `typecheck`, `test`
- `.npmrc` — `node-linker=hoisted` for Expo compatibility
- `.nvmrc` — pin Node 22

## 3. `packages/config` — Shared Configs

- `tsconfig/base.json`, `tsconfig/nextjs.json`, `tsconfig/expo.json`, `tsconfig/node.json`
- `eslint/index.js` — TypeScript + import + unused-imports rules
- `prettier/index.js` — 2-space, single quotes, trailing commas
- `tailwind/preset.js` — design tokens: teal primary `#0D9488`, coral accent, slate neutral, `rounded-2xl`, dark mode support (matches `docs/architecture/03-prd-vision.md` §3)
- `package.json` exports each preset

## 4. `packages/types` — Zod Schemas

- `src/schemas/auth.ts` — `RegisterSchema`, `LoginSchema`, `OtpSendSchema`, `OtpVerifySchema`, `RefreshSchema`, `PasswordResetSchema` (full S1 set)
- `src/schemas/users.ts` — `UserSchema`, `UpdateProfileSchema`, `FollowSchema`
- `src/schemas/common.ts` — `IdSchema`, `CursorSchema`, `PaginationSchema`
- `src/index.ts` — re-exports + inferred TS types via `z.infer`
- `package.json` — depends only on `zod`

## 5. `packages/sdk` — Typed Client + Hooks

- `src/client.ts` — axios factory; injects JWT from storage; auto-refresh on 401
- `src/hooks/auth.ts` — `useLogin`, `useRegister`, `useMeQuery`, `useOtpSend`, `useOtpVerify`
- `src/hooks/users.ts` — `useUserQuery`, `useUpdateProfile`, `useFollowUser`
- `src/ws.ts` — `WsClient` class: connect, subscribe, on/off, auto-reconnect with exponential backoff, replay-since-timestamp
- `package.json` — peers: `@tanstack/react-query`, `axios`, `@roamera/types`

## 6. `packages/ui` — Cross-Platform Primitives

- `src/Button.tsx`, `src/Card.tsx`, `src/Avatar.tsx`, `src/Input.tsx` — written with `Platform.OS` branching so they work in both Next.js (className) and Expo (NativeWind)
- `src/index.ts` re-exports all
- `package.json` — peer deps: `react`, `react-native`

## 7. `apps/api` — Node + Express 4 + TS

- `src/index.ts` — boot Express + http server + ws upgrade
- `src/app.ts` — middleware stack: `helmet`, `cors`, `pino-http`, `express-rate-limit`, idempotency middleware, error handler, route registry
- `src/db/client.ts` — `@libsql/client` factory (file mode locally via `DATABASE_URL=file:data/app.db`; remote Turso in prod)
- `src/db/schema.ts` — Drizzle schema:
  - **FULL** for S1: `users`, `sessions`, `otp_tokens`, `password_reset_tokens`, `invite_tokens`, `user_settings`, `follows`, `audit_log`, `idempotency_keys`
  - **Skeleton stubs** (commented headers + minimal column definitions) for: posts, post_photos, reactions, comments, bucket_list, saved_posts, notifications, notification_prefs, destinations, trips, trip_members, days, places, day_assignments, reservations, accommodations, trip_files, share_tokens, packing_*, budget_*, circles, circle_*, expense_groups, expenses, expense_splits, journeys, journey_*, visited_countries, visited_regions, user_badges, uploads, mcp_tokens, oauth_*, system_notices, user_notice_dismissals, place categories/tags
  - Each skeleton table is a one-liner so file structure mirrors `docs/architecture/06-system-architecture.md` §4.2
- `drizzle.config.ts` — points to schema + migrations dir
- `src/middleware/idempotency.ts`, `src/middleware/auth.ts` (stubs that S1 fills in), `src/middleware/error.ts`
- `src/routes/health.ts` — `GET /api/health` returns `{ status, db, version, uptime_ms }`
- `src/routes/index.ts` — mount registry
- `src/lib/logger.ts` (pino), `src/lib/env.ts` (zod-validated env)
- `src/seed.ts` — 5 demo users + 15 destinations + a few sample posts (deferred to S1; create empty stub now)
- `Dockerfile` — multi-stage Node 22 + pnpm
- `.env.example` — all env vars from §11.1
- `package.json` — express 4, @libsql/client, drizzle-orm, ws, helmet, cors, pino, pino-http, express-rate-limit, zod, bcryptjs, jsonwebtoken, otplib, multer, sharp, @aws-sdk/client-s3, resend, node-cron, axios

## 8. `apps/ai-service` — Python 3.12 + FastAPI

- `pyproject.toml` (or `requirements.txt`) — fastapi, pydantic, uvicorn, httpx, structlog, google-generativeai, groq, openai, anthropic
- `src/main.py` — FastAPI app + middleware
- `src/middleware/hmac.py` — validates `X-Service-Token` + `X-Timestamp`
- `src/ai/client.py` — `AIClient` Protocol + `GeminiClient` (working) + `GroqClient` (stub) + `OpenAIClient` (stub) + `AnthropicClient` (stub); selected by `AI_PROVIDER` env
- `src/routes/health.py` — `GET /health`
- `src/routes/plan.py`, `caption.py`, `hashtags.py`, `optimize.py`, `translate.py` — endpoint stubs that return 501 (S3 implements)
- `src/prompts/` — empty placeholders for Jinja2 templates
- `Dockerfile` — python:3.12-slim
- `.env.example`

## 9. `apps/web` — Next.js 15 App Router

- Bootstrapped via `pnpm create next-app@latest --ts --app --tailwind --eslint --src-dir`
- Replace default Tailwind config with `packages/config/tailwind/preset.js`
- Install shadcn/ui (`npx shadcn@latest init`); add `Button`, `Card`, `Input`, `Avatar`
- `src/app/(public)/page.tsx` — landing placeholder ("Roamera V2 — Coming Soon")
- `src/app/(public)/health/page.tsx` — fetches `/api/health` from API and displays status (proves end-to-end wiring)
- `src/app/(app)/` route group — empty placeholder for authenticated routes
- `src/middleware.ts` — auth guard stub
- `src/lib/api.ts` — re-exports SDK client configured with `NEXT_PUBLIC_API_URL`
- `next.config.mjs` — transpile `@roamera/*` packages; image domains for R2
- `next-pwa` configured (manifest stub)
- `next-intl` set up with `en` locale only (extra locales added in S10)
- `.env.example`

## 10. `apps/mobile` — Expo SDK + Expo Router

- Bootstrapped via `pnpm create expo-app@latest --template tabs` (TypeScript template with bottom tabs)
- Install NativeWind + configure (`tailwind.config.js`, `babel.config.js`)
- Use `packages/config/tailwind/preset.js`
- `app/_layout.tsx` — root layout
- `app/(tabs)/_layout.tsx` — bottom tabs: Home, Trips, AI, Circles, Profile (placeholders)
- `app/(tabs)/index.tsx` — Compass placeholder
- `app/(auth)/login.tsx`, `register.tsx`, `otp.tsx` — placeholders
- `app/health.tsx` — fetches API health endpoint (proves wiring)
- `lib/api.ts` — re-exports SDK
- i18next set up with `en` locale only
- `.env.example`

## 11. `docker-compose.yml`

- `api` service: builds `apps/api`, port 3000, mounts `data/` volume
- `ai-service`: builds `apps/ai-service`, port 8000
- Both share an internal network so `api` can call `http://ai-service:8000`
- No DB container (libSQL is file-based locally)

## 12. GitHub Actions CI

- `.github/workflows/ci.yml`:
  - On PR + push to main
  - Steps: pnpm install, pnpm lint, pnpm typecheck, pnpm build
  - Separate Python job for `apps/ai-service`: `pip install`, `ruff check`, `mypy`
  - Cache pnpm store + pip cache

## 13. Install + Verify

After all files written:

1. `pnpm install` (all Node deps across workspaces)
2. `cd apps/ai-service && pip install -r requirements.txt` (or `uv sync` if using uv)
3. `cd apps/mobile && npx expo prebuild --clean` (generates native iOS/Android dirs if needed; otherwise stays managed)
4. `cd apps/api && pnpm db:generate && pnpm db:migrate` (creates `data/app.db` and applies S1 schema)

**Acceptance checks (run from repo root):**
- `pnpm typecheck` — passes for all packages
- `pnpm lint` — passes
- `pnpm dev` — starts web (3001), api (3000), ai-service (8000) without error
- `curl http://localhost:3000/api/health` returns `{"status":"ok","db":"ok"}`
- Browser at `http://localhost:3001/health` displays the API health response
- `apps/api/data/app.db` exists with the S1 tables

## 14. Final Commit Layout

```
fullstack-main/
├── apps/
│   ├── web/          (Next.js 15 + shadcn + tailwind)
│   ├── mobile/       (Expo Router + NativeWind)
│   ├── api/          (Express + Drizzle + libSQL + ws)
│   └── ai-service/   (FastAPI + AIClient stubs)
├── packages/
│   ├── types/        (Zod schemas - S1 set)
│   ├── sdk/          (axios + TanStack hooks + WsClient)
│   ├── ui/           (cross-platform primitives)
│   └── config/       (tsconfig + eslint + tailwind preset)
├── legacy/           (V1 archived, do-not-import README)
├── TREK_alt/         (unchanged, read-only)
├── data/             (gitignored: app.db + uploads/)
├── docs/architecture/  (unchanged)
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .github/workflows/ci.yml
├── .gitignore
├── .nvmrc
├── .npmrc
├── AGENTS.md
└── README.md         (updated with V2 setup instructions)
```

## What this plan does NOT do
- No auth route handlers (S1)
- No real Drizzle migrations beyond S1 tables (each later sprint adds its own)
- No real AI service endpoints (S3)
- No production deploy (S12)
- No tests beyond CI lint/typecheck (Vitest/Playwright start in S2/S12)

## Notes
- Estimated runtime end-to-end: 20–30 minutes (most spent on `pnpm install` + Expo prebuild)
- Existing V1 `node_modules/` directories under `backend/`, `frontend/`, `mobile/`, `fusion/` will be moved or deleted as-is (no clean removal needed)
- `.claude/` directory is left untouched (your local Cursor/Claude config)
