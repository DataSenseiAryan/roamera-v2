# Sprint 6 -- Travel Circles, Real-Time Chat, Collab, and S1-S5 Debt Cleanup

Sprint 6 adds the **Circles** feature (Roamera's branded "Meetways" for group travel coordination) and **Trip Collab** (in-trip chat, notes, and polls). Both build on the existing WebSocket infrastructure from S4, broadcasting events to `circle:{id}` and `trip:{id}` rooms.

---

## Part A: S1-S5 Debt Cleanup

- **Idempotency middleware fixed** -- Updated `apps/api/src/middleware/idempotency.ts` to JWT-decode the Bearer token (without verification) to extract userId for idempotency key namespacing. Previously all keys were stored under `'anonymous'`.
- **S0-S3 roadmap checkboxes** -- Updated `docs/architecture/08-build-roadmap.md` to mark all S0-S3 deliverables as `[x]`.
- **Working Demo Guarantee** -- Updated `docs/sprint-verification.md` to mark all guarantee boxes as `[x]`.

---

## Part B: Schema Migrations

Migration: `drizzle/0005_perpetual_moonstone.sql`

**New tables:**
- `circle_poll_votes` -- pollId, userId, optionIndex (unique on all three)
- `circle_message_reactions` -- messageId, userId, emoji (unique on all three)
- `collab_messages` -- id, tripId, userId, content, replyToId (self-FK), isDeleted, createdAt
- `collab_message_reactions` -- messageId, userId, emoji (unique on all three)
- `collab_notes` -- id, tripId, userId, title, content, category, color, isPinned, createdAt, updatedAt
- `collab_polls` -- id, tripId, userId, question, optionsJson, isMultiple, isClosed, deadline, createdAt
- `collab_poll_votes` -- pollId, userId, optionIndex

**Modified existing stubs:**
- `circle_members` -- added unique index on (circle_id, user_id)
- `circle_messages.reply_to_id` -- added self-FK reference

---

## Part C: Backend Routes

### Circles (`apps/api/src/routes/circles.ts`)

17 endpoints at `/api/v1/circles`. Key features:
- CRUD with owner/member access control
- Join (public only) / Leave / Invite by username / Remove member
- Cursor-paginated chat messages with reactions (toggle) and soft-delete
- Polls with single-choice (replaces prior vote) and multi-choice (toggle per option)
- WS broadcast to `circle:{circleId}` for all mutations

### Trip Collab (`apps/api/src/routes/collab.ts`)

13 endpoints at `/api/v1/trips/:tripId/collab`. Key features:
- Chat messages with reactions (toggle) and soft-delete (author or trip owner)
- Notes CRUD with pin toggle (editor+)
- Polls with voting and close
- WS broadcast to `trip:{tripId}` for all mutations

---

## Part D: Types and SDK

- `packages/types/src/schemas/circles.ts` -- CircleSchema, CircleMessageSchema, CirclePollSchema, etc.
- `packages/types/src/schemas/collab.ts` -- CollabMessageSchema, CollabNoteSchema, CollabPollSchema, etc.
- `packages/sdk/src/hooks/circles.ts` -- 17 hooks for circles operations
- `packages/sdk/src/hooks/collab.ts` -- 12 hooks for collab operations

---

## Part E: Frontend

### Circles (`apps/web/src/app/(app)/circles/`)
- **List page** (`circles/page.tsx`) -- grid of circle cards, create modal
- **Detail page** (`circles/[circleId]/page.tsx`) -- main chat column, polls sidebar, members sidebar
  - Chat: real-time messages via WS + 5s polling, reactions, reply-to, composer
  - Polls: voting with progress bars, create modal
  - Members: invite (owner), remove (owner), leave (non-owner)
- Circles link added to navbar

### Trip Collab (`apps/web/src/components/trips/collab/collab-panel.tsx`)
- 4th tab added to trip detail page (Itinerary | Budget | Packing | **Collab**)
- Sub-tabs: **Chat** | **Notes** | **Polls**
- Chat: same UX as circle chat, scoped to trip
- Notes: color-coded cards, pin/unpin, create modal with color presets
- Polls: voting, create modal

---

## Part F: Verification

See `docs/sprint-verification.md` for S6 API smoke tests and demo walkthrough.

### Acceptance Criteria
- [x] Circles API: 2 circles seeded, messages/polls verified
- [x] Trip collab: 3 messages, 2 notes, 1 poll seeded
- [x] Typecheck passes for all packages
- [x] Seed idempotent (second run skips S6 data)

---

## Part G: Git

All S6 changes committed and pushed to `DataSenseiAryan/roamera-v2` on `main` branch.
