# Sprint 1 — Auth & Profile (As-Built)

**Status: ✅ Complete**  
**Sprint duration: Pre-conversation (before May 2026)**

---

## Goal

Implement authentication, user management, and profile infrastructure as the foundation for all subsequent sprints.

---

## Architecture

```
Web (Next.js) → POST /api/v1/auth/register
              → POST /api/v1/auth/login
              → GET  /api/v1/auth/refresh
              → POST /api/v1/auth/logout
              → POST /api/v1/auth/ws-token
              → GET  /api/v1/users/me
              → PATCH /api/v1/users/me
              → GET  /api/v1/users/:username
              → POST /api/v1/users/:userId/follow
              → DELETE /api/v1/users/:userId/follow
              → GET  /api/v1/users/search
```

---

## Key Files Implemented

| File | Description |
|------|-------------|
| `apps/api/src/routes/auth.ts` | JWT auth: register, login, refresh, logout, OTP, ws-token |
| `apps/api/src/routes/users.ts` | User CRUD, avatar upload, follow/unfollow, search |
| `apps/api/src/db/schema.ts` | users, sessions, follows, userSettings, OTP, idempotency tables |
| `apps/api/src/middleware/auth.ts` | JWT authenticate + optionalAuthenticate middleware |
| `apps/api/src/lib/storage.ts` | Local disk + R2 adapter for file uploads |
| `packages/sdk/src/hooks/auth.ts` | useLogin, useRegister, useLogout, useMe hooks |
| `packages/sdk/src/hooks/users.ts` | useUserQuery, useUpdateProfile, useFollowUser hooks |
| `apps/web/src/app/(auth)/login/page.tsx` | Login page |
| `apps/web/src/app/(auth)/register/page.tsx` | Register page |
| `apps/web/src/app/(app)/u/[username]/page.tsx` | User profile page |

---

## Definition of Done — All Checked ✅

- [x] Register with email/password → email verified
- [x] Login → JWT access token + refresh token
- [x] Protected routes via `authenticate` middleware
- [x] Public profile via `optionalAuthenticate` (fixed in S3 debt pass)
- [x] Follow/unfollow with follower/following counts
- [x] Avatar upload (local dev, R2 prod)
- [x] Password reset flow with email OTP
- [x] Session management (logout, refresh)
- [x] WebSocket ephemeral token endpoint
