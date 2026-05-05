# legacy/ — Feature Reference Only

This directory contains the archived Roamera V1 codebase.

**DO NOT import from this directory into `apps/` or `packages/`.**

It exists solely as a feature reference — to understand what was built, what routes existed,
and what the original data model looked like. The V2 build starts fresh.

| Directory | Contents |
|-----------|----------|
| `backend/` | Node.js + Express 5 + Prisma + PostgreSQL (V1 API) |
| `frontend/` | React 19 + Vite + Tailwind v4 (V1 web) |
| `mobile/` | React Native 0.72 bare (V1 mobile) |

For architecture details, see `docs/architecture/01-roamera-existing.md`.
