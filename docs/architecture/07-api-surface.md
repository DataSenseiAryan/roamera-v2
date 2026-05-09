# 07 — Roamera V2: API Surface Reference

> All endpoints versioned under `/api/v1/`.
> Authentication: `Authorization: Bearer <accessToken>` unless marked `[public]`.
> Base URL: `https://api.roamera.in` (production).
> Request bodies are JSON; file uploads are `multipart/form-data`.
> All mutations support idempotency via `Idempotency-Key: <uuid>` header.
> Zod schema names reference `packages/types/src/schemas/`.

---

## 1. Auth — `/api/v1/auth`

| Method | Path | Auth | Description | Zod Schema |
|--------|------|------|-------------|------------|
| `POST` | `/register` | [public] | Create account with email + password | `RegisterSchema` |
| `POST` | `/login` | [public] | Email + password login | `LoginSchema` |
| `POST` | `/otp/send` | [public] | Send 6-digit OTP to email | `OtpSendSchema` |
| `POST` | `/otp/verify` | [public] | Verify OTP, issue JWT | `OtpVerifySchema` |
| `GET`  | `/verify-email` | [public] | `?token=` — verify email address | — |
| `POST` | `/refresh` | [public] | Rotate refresh token, issue new pair | `RefreshSchema` |
| `POST` | `/logout` | auth | Invalidate session | — |
| `POST` | `/password/reset-request` | [public] | Send password reset email | `PasswordResetRequestSchema` |
| `POST` | `/password/reset` | [public] | Consume token, set new password | `PasswordResetSchema` |
| `POST` | `/password/change` | auth | Change password (requires current) | `PasswordChangeSchema` |
| `GET`  | `/me` | auth | Current user profile | — |
| `GET`  | `/ws-token` | auth | Issue ephemeral WebSocket token (10 min TTL) | — |

**V1 → V2 mapping:**
| V1 endpoint | V2 equivalent |
|-------------|---------------|
| `POST /api/auth/register` | `POST /api/v1/auth/register` |
| `POST /api/auth/login` | `POST /api/v1/auth/login` |
| `GET /api/auth/me` | `GET /api/v1/auth/me` |
| ❌ no OTP | `POST /api/v1/auth/otp/send` (new) |
| ❌ no ws_token | `GET /api/v1/auth/ws-token` (new, TREK pattern) |

---

## 2. Users — `/api/v1/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:username` | auth | Public profile by username |
| `PATCH` | `/me` | auth | Update bio, home city, avatar, interests, budget band |
| `POST` | `/me/avatar` | auth | Upload avatar (multipart; → R2) |
| `DELETE` | `/me` | auth | Delete account (soft-delete, 30d grace) |
| `GET` | `/search` | auth | `?q=` user search |
| `GET` | `/:userId/followers` | auth | Follower list (paginated) |
| `GET` | `/:userId/following` | auth | Following list (paginated) |
| `POST` | `/:userId/follow` | auth | Follow a user |
| `DELETE` | `/:userId/follow` | auth | Unfollow a user |
| `GET` | `/me/settings` | auth | Key/value user settings |
| `PUT` | `/me/settings` | auth | Bulk upsert settings |

---

## 3. Posts (Moments) — `/api/v1/posts`

| Method | Path | Auth | Description | Zod Schema |
|--------|------|------|-------------|------------|
| `GET`  | `/` | auth | Feed: `?feed=global\|following` + `?cursor=` + `?limit=` | — |
| `POST` | `/` | auth | Create Moment | `CreatePostSchema` |
| `GET`  | `/:postId` | [public] | Post detail | — |
| `PATCH` | `/:postId` | auth (owner) | Edit post | `UpdatePostSchema` |
| `DELETE` | `/:postId` | auth (owner) | Delete post | — |
| `POST` | `/:postId/photos` | auth (owner) | Upload 1-5 photos (multipart) | — |
| `DELETE` | `/:postId/photos/:photoId` | auth (owner) | Remove photo | — |
| `POST` | `/:postId/reactions` | auth | React (type: love\|epic\|wander\|wanna_go\|amazing) | `ReactionSchema` |
| `DELETE` | `/:postId/reactions` | auth | Remove reaction | — |
| `GET`  | `/:postId/reactions` | auth | Reaction counts + viewer's reaction | — |
| `GET`  | `/:postId/comments` | auth | Comments (paginated, nested) | — |
| `POST` | `/:postId/comments` | auth | Add comment | `CreateCommentSchema` |
| `PATCH` | `/:postId/comments/:commentId` | auth (owner) | Edit comment | — |
| `DELETE` | `/:postId/comments/:commentId` | auth (owner) | Delete comment | — |
| `POST` | `/:postId/save` | auth | Save post (Wanna Go) | — |
| `DELETE` | `/:postId/save` | auth | Unsave post | — |

**CreatePostSchema fields:**
```
title, content (rich text), destinations[] (name+lat+lng),
date_from, date_to, activities[], accommodation,
budget_inr, vacation_type, transport_mode,
hashtags[], itinerary_json
```

---

## 4. Feed & Discover — `/api/v1/feed`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/compass` | auth | Main feed (posts + cards) — cursor paginated |
| `GET`  | `/trending` | auth | Trending destinations + hashtags |
| `GET`  | `/destinations` | [public] | All destinations (paginated, filterable by category/country) |
| `GET`  | `/destinations/:id` | [public] | Single destination detail |
| `GET`  | `/search` | auth | `?q=` — unified search (posts + users + destinations) |
| `GET`  | `/saved` | auth | Current user's saved posts (Wanna Go) |
| `GET`  | `/bucket-list` | auth | Bucket list places |
| `POST` | `/bucket-list` | auth | Add place to bucket list |
| `DELETE` | `/bucket-list/:id` | auth | Remove from bucket list |

---

## 5. Trips — `/api/v1/trips` ✅ S4 Implemented

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/` | auth | User's trips (owned + member) |
| `POST` | `/` | auth | Create trip | `CreateTripSchema` |
| `GET`  | `/:tripId` | auth (member) | Trip detail |
| `PATCH` | `/:tripId` | auth (owner/editor) | Update trip metadata |
| `DELETE` | `/:tripId` | auth (owner) | Delete trip |
| `POST` | `/:tripId/cover` | auth (owner) | Upload cover image |
| `POST` | `/:tripId/copy` | auth (member) | Duplicate trip |
| `GET`  | `/:tripId/bundle` | auth (member) | Full trip offline payload — *deferred to S10* |
| `GET`  | `/:tripId/export/ics` | auth (member) | Export trip as `.ics` calendar |
| `POST` | `/:tripId/share` | auth (owner) | Create/refresh public share link |
| `DELETE` | `/:tripId/share` | auth (owner) | Delete share link |
| `GET`  | `/shared/:token` | [public] | Public trip view (read-only) |

### 5.1 Trip Members ✅ S4 Implemented

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/members` | auth (member) | List members + roles |
| `POST` | `/:tripId/members` | auth (owner) | Add member by username |
| `PATCH` | `/:tripId/members/:userId` | auth (owner) | Change role |
| `DELETE` | `/:tripId/members/:userId` | auth (owner) | Remove member |

### 5.2 Trip Days ✅ S4 Implemented

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/days` | auth (member) | All days |
| `POST` | `/:tripId/days` | auth (editor) | Add day |
| `PATCH` | `/:tripId/days/:dayId` | auth (editor) | Update day title/notes |
| `DELETE` | `/:tripId/days/:dayId` | auth (editor) | Delete day + renumber |

### 5.3 Trip Places ✅ S4 Implemented

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/places` | auth (member) | All places |
| `POST` | `/:tripId/places` | auth (editor) | Add place |
| `PATCH` | `/:tripId/places/:placeId` | auth (editor) | Update place |
| `DELETE` | `/:tripId/places/:placeId` | auth (editor) | Delete place + cleanup assignments |
| `POST` | `/:tripId/places/import/gpx` | auth (editor) | Bulk import from GPX — *post-MVP* |

### 5.4 Trip Assignments (Day ↔ Place links) ✅ S4 Implemented

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/assignments` | auth (member) | All assignments |
| `POST` | `/:tripId/assignments` | auth (editor) | Assign place to day |
| `PATCH` | `/:tripId/assignments/:id` | auth (editor) | Update order/times/notes |
| `PATCH` | `/:tripId/assignments/:id/move` | auth (editor) | Move to different day |
| `DELETE` | `/:tripId/assignments/:id` | auth (editor) | Remove assignment |

### 5.5 Day Notes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/days/:dayId/notes` | auth (member) | Day notes |
| `POST` | `/:tripId/days/:dayId/notes` | auth (editor) | Add note |
| `PATCH` | `/:tripId/days/:dayId/notes/:noteId` | auth (editor) | Edit note |
| `DELETE` | `/:tripId/days/:dayId/notes/:noteId` | auth (editor) | Delete note |

### 5.6 Reservations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/reservations` | auth (member) | All reservations |
| `POST` | `/:tripId/reservations` | auth (editor) | Create reservation (flight/hotel/restaurant) |
| `PATCH` | `/:tripId/reservations/:id` | auth (editor) | Update reservation |
| `DELETE` | `/:tripId/reservations/:id` | auth (editor) | Delete reservation |

### 5.7 Accommodations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/accommodations` | auth (member) | All accommodation spans |
| `POST` | `/:tripId/accommodations` | auth (editor) | Add accommodation |
| `PATCH` | `/:tripId/accommodations/:id` | auth (editor) | Update |
| `DELETE` | `/:tripId/accommodations/:id` | auth (editor) | Delete |

### 5.8 Budget ✅ Implemented (S5)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/budget` | auth (member) | Budget summary + items + debts |
| `POST` | `/:tripId/budget/items` | auth (editor) | Add budget item |
| `PATCH` | `/:tripId/budget/items/:id` | auth (editor) | Update item |
| `DELETE` | `/:tripId/budget/items/:id` | auth (editor) | Delete item |
| `POST` | `/:tripId/budget/items/:id/splits` | auth (editor) | Set member splits |
| `PATCH` | `/:tripId/budget/items/:id/splits/:userId` | auth (editor) | Toggle isPaid |
| `POST` | `/:tripId/budget/settle` | auth (editor) | Record settlement |
| `GET`  | `/:tripId/budget/settlements` | auth (member) | List settlements |

### 5.9 Packing ✅ Implemented (S5)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/packing` | auth (member) | Full packing list + progress |
| `POST` | `/:tripId/packing/items` | auth (editor) | Add item |
| `PATCH` | `/:tripId/packing/items/:id` | auth (member) | Update (check/uncheck/rename/reorder) |
| `DELETE` | `/:tripId/packing/items/:id` | auth (editor) | Delete item |
| `POST` | `/:tripId/packing/items/reorder` | auth (editor) | Bulk reorder items |
| `GET`  | `/:tripId/packing/categories` | auth (member) | List categories + assignees |
| `POST` | `/:tripId/packing/categories` | auth (editor) | Add category |
| `PATCH` | `/:tripId/packing/categories/:id` | auth (editor) | Update category |
| `DELETE` | `/:tripId/packing/categories/:id` | auth (editor) | Delete category + cascade |
| `GET`  | `/:tripId/packing/bags` | auth (member) | Bags list + item counts |
| `POST` | `/:tripId/packing/bags` | auth (editor) | Add bag |
| `PATCH` | `/:tripId/packing/bags/:id` | auth (editor) | Update bag |
| `DELETE` | `/:tripId/packing/bags/:id` | auth (editor) | Delete bag |
| `POST` | `/:tripId/packing/bags/:id/items` | auth (editor) | Assign item to bag |
| `DELETE` | `/:tripId/packing/bags/:id/items/:itemId` | auth (editor) | Remove item from bag |
| `POST` | `/:tripId/packing/templates/apply` | auth (editor) | Apply packing template |
| `POST` | `/:tripId/packing/templates/save` | auth (editor) | Save list as template |

### 5.10 Collab (Chat, Notes, Polls) ✅ Implemented (S6)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/collab/messages` | auth (member) | Chat history (cursor-paginated) |
| `POST` | `/:tripId/collab/messages` | auth (member) | Send message |
| `POST` | `/:tripId/collab/messages/:id/react` | auth (member) | Toggle emoji reaction |
| `DELETE` | `/:tripId/collab/messages/:id` | auth (owner or author) | Soft-delete message |
| `GET`  | `/:tripId/collab/notes` | auth (member) | Shared notes (pinned first) |
| `POST` | `/:tripId/collab/notes` | auth (member) | Create note |
| `PATCH` | `/:tripId/collab/notes/:id` | auth (author or editor) | Edit note |
| `DELETE` | `/:tripId/collab/notes/:id` | auth (author or owner) | Delete note |
| `PATCH` | `/:tripId/collab/notes/:id/pin` | auth (editor) | Toggle pin |
| `GET`  | `/:tripId/collab/polls` | auth (member) | Polls list with vote counts |
| `POST` | `/:tripId/collab/polls` | auth (member) | Create poll |
| `POST` | `/:tripId/collab/polls/:id/vote` | auth (member) | Vote (single clears prior; multi toggles) |
| `POST` | `/:tripId/collab/polls/:id/close` | auth (editor) | Close poll |

### 5.11 Trip Files

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/:tripId/files` | auth (member) | File list |
| `POST` | `/:tripId/files` | auth (editor) | Upload file (multipart → R2) |
| `PATCH` | `/:tripId/files/:id` | auth (editor) | Update metadata, star, link to place/reservation |
| `DELETE` | `/:tripId/files/:id` | auth (editor) | Trash file |
| `DELETE` | `/:tripId/files/:id/permanent` | auth (owner) | Permanently delete |
| `GET`  | `/:tripId/files/:id/download` | auth (member) | Presigned download URL |
| `POST` | `/:tripId/files/:id/share` | auth (member) | Create public share download token |

---

## 6. Circles (Meetways) — `/api/v1/circles` ✅ Implemented (S6)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/` | auth | User's circles (owned + joined) + public circles |
| `POST` | `/` | auth | Create circle |
| `GET`  | `/:circleId` | auth | Circle detail + members (public circles viewable by all) |
| `PATCH` | `/:circleId` | auth (owner) | Update circle |
| `DELETE` | `/:circleId` | auth (owner) | Delete circle |
| `POST` | `/:circleId/join` | auth | Join public circle |
| `POST` | `/:circleId/leave` | auth (member) | Leave circle |
| `POST` | `/:circleId/invite` | auth (owner) | Invite users by username |
| `DELETE` | `/:circleId/members/:userId` | auth (owner) | Remove member |
| `GET`  | `/:circleId/messages` | auth (member) | Chat history (cursor-paginated) |
| `POST` | `/:circleId/messages` | auth (member) | Send message (with optional replyToId) |
| `POST` | `/:circleId/messages/:id/react` | auth (member) | Toggle emoji reaction |
| `DELETE` | `/:circleId/messages/:id` | auth (owner or author) | Soft-delete message |
| `GET`  | `/:circleId/polls` | auth (member) | Polls with vote counts + myVotes |
| `POST` | `/:circleId/polls` | auth (member) | Create poll |
| `POST` | `/:circleId/polls/:id/vote` | auth (member) | Vote (single replaces; multi toggles) |
| `POST` | `/:circleId/polls/:id/close` | auth (owner) | Close poll |

---

## 7. JustSplit (Expense Groups) — `/api/v1/expenses` ✅ Implemented (S7)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/groups` | auth | User's expense groups |
| `POST` | `/groups` | auth | Create group |
| `GET`  | `/groups/:groupId` | auth (member) | Group + balance summary |
| `PATCH` | `/groups/:groupId` | auth (owner) | Update group |
| `DELETE` | `/groups/:groupId` | auth (owner) | Delete group |
| `POST` | `/groups/:groupId/members` | auth (owner) | Add member |
| `DELETE` | `/groups/:groupId/members/:userId` | auth (owner) | Remove member |
| `GET`  | `/groups/:groupId/expenses` | auth (member) | Expense list |
| `POST` | `/groups/:groupId/expenses` | auth (member) | Add expense |
| `PATCH` | `/groups/:groupId/expenses/:id` | auth (owner) | Edit expense |
| `DELETE` | `/groups/:groupId/expenses/:id` | auth (owner) | Delete expense |
| `GET`  | `/groups/:groupId/balances` | auth (member) | Current balances + simplified debts |
| `POST` | `/groups/:groupId/settle` | auth (member) | Record settlement |

---

## 8. Journey Magazine — `/api/v1/journeys` ✅ Implemented (S8)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/` | auth | User's journeys |
| `POST` | `/` | auth | Create journey |
| `GET`  | `/:journeyId` | auth (contributor) | Journey detail + entries |
| `PATCH` | `/:journeyId` | auth (owner) | Update title/description/layout |
| `DELETE` | `/:journeyId` | auth (owner) | Delete journey |
| `POST` | `/:journeyId/share` | auth (owner) | Create share link |
| `DELETE` | `/:journeyId/share` | auth (owner) | Revoke share link |
| `GET`  | `/public/:token` | [public] | Public journey view |
| `GET`  | `/:journeyId/entries` | auth (contributor) | Entries |
| `POST` | `/:journeyId/entries` | auth (contributor) | Add entry (rich content JSON) |
| `PATCH` | `/:journeyId/entries/:id` | auth (contributor) | Edit entry |
| `DELETE` | `/:journeyId/entries/:id` | auth (contributor) | Delete entry |
| `POST` | `/:journeyId/entries/:id/photos` | auth (contributor) | Upload photos |
| `POST` | `/:journeyId/contributors` | auth (owner) | Invite contributor |
| `DELETE` | `/:journeyId/contributors/:userId` | auth (owner) | Remove contributor |
| `POST` | `/:journeyId/trips/:tripId` | auth (owner) | Link a trip to journey |

---

## 9. Atlas — `/api/v1/atlas` ✅ Implemented (S8)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/countries` | auth | All visited countries for user |
| `POST` | `/countries/:code` | auth | Mark country as visited |
| `DELETE` | `/countries/:code` | auth | Unmark country |
| `GET`  | `/stats` | auth | Travel stats (countries, %, regions, badges) |
| `GET`  | `/regions/:countryCode` | auth | Visited regions within a country |
| `POST` | `/regions/:regionCode` | auth | Mark region visited |

---

## 10. Gamification — `/api/v1/gamification` ✅ Implemented (S8)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/badges` | auth | User's earned badges |
| `GET`  | `/stats` | auth | Aggregated travel stats |
| `GET`  | `/leaderboard` | auth | Top travelers (global or friends) |

---

## 11. TravelLens (Flight + Hotel Search) — `/api/v1/travel`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/flights` | auth | `?origin=&destination=&date=&adults=` — Amadeus flight search |
| `GET`  | `/hotels` | auth | `?city=&checkin=&checkout=&adults=` — Amadeus hotel search |
| `GET`  | `/airports` | auth | `?q=` — airport search by name/IATA |

Results include deep-link URLs to Skyscanner / Google Flights / Booking.com for final booking.

---

## 12. Maps & Places — `/api/v1/maps` ✅ S4 Implemented

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/search` | auth | `?q=&lat=&lng=` — place text search (Nominatim) |
| `GET`  | `/autocomplete` | auth | `?q=` — typeahead suggestions |
| `GET`  | `/reverse` | auth | `?lat=&lng=` — reverse geocode (Nominatim) |
| `GET`  | `/place` | auth | `?id=&source=osm` — place details — *deferred (use `/search`)* |
| `GET`  | `/overpass` | auth | `?south=&west=&north=&east=&types=` — POI search via Overpass (OSM) |

Notes:
- Nominatim requires 1 req/sec rate limit — enforced via in-memory throttle
- Overpass uses `?south,west,north,east` bounding box (not `?bbox`)
- All results are cached in-memory for 5 minutes

---

## 13. Weather — `/api/v1/weather` ✅ S4 Implemented

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/current` | auth | `?lat=&lng=` — current conditions (Open-Meteo) |
| `GET`  | `/forecast` | auth | `?lat=&lng=&days=` — up to 16-day forecast |

Notes:
- No API key required (Open-Meteo is free)
- Cached 5 minutes per `lat,lng,days` key
- May fail locally if Node.js cannot verify Open-Meteo SSL cert; set `NODE_TLS_REJECT_UNAUTHORIZED=0` for dev

---

## 14. Notifications — `/api/v1/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/` | auth | In-app notification feed (paginated) |
| `GET`  | `/unread-count` | auth | Unread count |
| `POST` | `/:id/read` | auth | Mark as read |
| `POST` | `/read-all` | auth | Mark all read |
| `DELETE` | `/:id` | auth | Delete notification |
| `POST` | `/:id/respond` | auth | Respond to interactive notification (accept/decline) |
| `GET`  | `/preferences` | auth | Per-event-type channel preferences |
| `PATCH` | `/preferences` | auth | Update preferences |

---

## 15. Packing Templates (Admin) — `/api/v1/admin/packing-templates`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/` | admin | All templates |
| `POST` | `/` | admin | Create template |
| `PATCH` | `/:id` | admin | Update template |
| `DELETE` | `/:id` | admin | Delete template |
| `GET`  | `/:id/categories` | admin | Template categories |
| `POST` | `/:id/categories` | admin | Add category |
| `POST` | `/categories/:catId/items` | admin | Add item to category |

---

## 16. Admin — `/api/v1/admin`

All routes require `role = admin`.

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/users` | User list (paginated, filterable) |
| `GET`  | `/users/:id` | User detail + stats |
| `PATCH` | `/users/:id` | Update user (role, suspended, etc.) |
| `DELETE` | `/users/:id` | Delete user |
| `GET`  | `/audit-log` | Paginated audit log |
| `GET`  | `/notices` | System notices |
| `POST` | `/notices` | Create notice |
| `PATCH` | `/notices/:id` | Update notice |
| `DELETE` | `/notices/:id` | Delete notice |
| `GET`  | `/stats` | Dashboard stats (users, posts, trips counts) |

---

## 17. MCP Server — `/api/v1/mcp`

OAuth 2.1 endpoints for AI assistants (TREK pattern).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/.well-known/oauth-authorization-server` | [public] | OAuth discovery |
| `POST` | `/oauth/token` | [public] | Authorization code + refresh token exchange |
| `POST` | `/oauth/revoke` | auth | Revoke token |
| `POST` | `/oauth/register` | auth | Dynamic Client Registration |
| `GET`  | `/oauth/authorize` | auth | Consent UI |
| `POST` | `/oauth/authorize` | auth | Submit consent |
| `GET`  | `/tokens` | auth | User's MCP static tokens |
| `POST` | `/tokens` | auth | Create static MCP token |
| `DELETE` | `/tokens/:id` | auth | Revoke static token |

**MCP Tools (AI assistant can call):**

| Tool | Description |
|------|-------------|
| `get_trips` | List user's trips |
| `get_trip_details` | Full trip data (days, places, assignments) |
| `create_trip` | Create new trip |
| `add_place_to_trip` | Add a place to a trip day |
| `get_weather` | Weather for a location |
| `search_places` | Search for POIs |
| `get_budget_summary` | Trip budget status |
| `get_packing_list` | Packing checklist |
| `mark_item_packed` | Check/uncheck packing item |
| `get_user_atlas` | Visited countries |
| `get_notifications` | Unread notifications |

---

## 18. Files / Uploads — `/api/v1/files`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/upload-url` | auth | Get presigned PUT URL for R2 upload |
| `POST` | `/confirm` | auth | Confirm upload complete, create `uploads` record |
| `GET`  | `/:key/download-url` | auth | Get presigned GET URL for gated download |
| `DELETE` | `/:key` | auth (owner) | Delete file from R2 + DB |

---

## 19. Public Config — `/api/v1/config`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET`  | `/` | [public] | Server version, feature flags, invite-only mode |
| `GET`  | `/health` | [public] | `{ status: "ok", db: "ok", version, uptime_ms }` |

---

## 20. AI Service Endpoints (Internal — HMAC-signed)

Base URL: `http://ai-service:8000` (internal only; not exposed publicly).
All require `X-Service-Token` HMAC header + `X-Timestamp` + `X-User-Id`.

| Method | Path | Description | Request | Response |
|--------|------|-------------|---------|----------|
| `POST` | `/v1/ai/plan` | Generate trip itinerary | `{ prompt, preferences, budget_band, nights, destination }` | `{ itinerary: DayPlan[] }` |
| `POST` | `/v1/ai/plan/refine` | Conversationally refine plan | `{ previous_plan, user_message, context }` | `{ itinerary: DayPlan[], reply: string }` |
| `POST` | `/v1/ai/optimize-budget` | Rewrite plan within tighter budget | `{ itinerary, new_budget, currency }` | `{ itinerary: DayPlan[] }` |
| `POST` | `/v1/ai/caption` | Generate photo caption | `{ image_url, context: { destination, trip_title } }` | `{ caption: string }` |
| `POST` | `/v1/ai/hashtags` | Generate hashtags | `{ post_content, destination, vacation_type }` | `{ hashtags: string[] }` |
| `POST` | `/v1/ai/translate` | Translate user content | `{ text, target_locale }` | `{ translated: string }` |
| `GET`  | `/health` | Service health | — | `{ status: "ok", provider: string }` |

---

## 21. WebSocket Event Reference

Connection: `wss://api.roamera.in/ws?token=<ws_token>`

### Client → Server messages

| Type | Payload | Description |
|------|---------|-------------|
| `subscribe` | `{ rooms: string[] }` | Join rooms (server validates membership) |
| `unsubscribe` | `{ rooms: string[] }` | Leave rooms |
| `ping` | `{}` | Keepalive |

### Server → Client events

| Type | Rooms | Payload | Trigger |
|------|-------|---------|---------|
| `connected` | — | `{ user_id, server_time }` | On connect |
| `subscribed` | — | `{ rooms }` | On subscribe |
| `pong` | — | `{}` | On ping |
| `trip:updated` | `trip:{id}` | `{ tripId, data }` | Trip metadata changed |
| `member:added` | `trip:{id}` | `{ userId, username, role }` | Member added to trip |
| `member:removed` | `trip:{id}` | `{ userId }` | Member removed |
| `day:created` | `trip:{id}` | `{ id, tripId, dayNumber, title }` | Day added |
| `day:updated` | `trip:{id}` | `{ id, tripId, dayNumber, title }` | Day changed |
| `day:deleted` | `trip:{id}` | `{ dayId }` | Day removed |
| `place:created` | `trip:{id}` | `{ id, tripId, name, lat, lng, ... }` | Place added |
| `place:updated` | `trip:{id}` | `{ id, tripId, name, lat, lng, ... }` | Place edited |
| `place:deleted` | `trip:{id}` | `{ placeId }` | Place removed |
| `assignment:created` | `trip:{id}` | `{ id, dayId, placeId, orderIndex }` | Assignment created |
| `assignment:updated` | `trip:{id}` | `{ id, dayId, placeId, orderIndex }` | Assignment reordered/changed |
| `assignment:deleted` | `trip:{id}` | `{ assignmentId }` | Assignment removed |
| `note:created` | `trip:{id}` | `{ id, dayId, content }` | Day note added |
| `note:updated` | `trip:{id}` | `{ id, dayId, content }` | Day note edited |
| `note:deleted` | `trip:{id}` | `{ noteId }` | Day note removed |
| `budget:created` | `trip:{id}` | `{ tripId, item }` | Budget item added |
| `budget:updated` | `trip:{id}` | `{ tripId, item }` | Budget item changed |
| `budget:deleted` | `trip:{id}` | `{ tripId, itemId }` | Budget item removed |
| `budget:splits_updated` | `trip:{id}` | `{ tripId, itemId }` | Splits changed |
| `budget:settled` | `trip:{id}` | `{ tripId, settlement }` | Settlement recorded |
| `packing:item_created` | `trip:{id}` | `{ tripId, item }` | Packing item added |
| `packing:item_updated` | `trip:{id}` | `{ tripId, item }` | Packing item changed/checked |
| `packing:item_deleted` | `trip:{id}` | `{ tripId, itemId }` | Packing item removed |
| `packing:category_updated` | `trip:{id}` | `{ tripId, category }` | Category changed |
| `packing:bag_updated` | `trip:{id}` | `{ tripId, bag }` | Bag changed |
| `packing:template_applied` | `trip:{id}` | `{ tripId, templateId }` | Template applied |
| `collab:message` | `trip:{id}` | `{ tripId, message }` | New collab chat message |
| `collab:reaction` | `trip:{id}` | `{ tripId, messageId, emoji }` | Collab message reaction toggled |
| `collab:message_deleted` | `trip:{id}` | `{ tripId, messageId }` | Collab message soft-deleted |
| `collab:note_created` | `trip:{id}` | `{ tripId, note }` | Shared note created |
| `collab:note_updated` | `trip:{id}` | `{ tripId, note }` | Shared note updated/pinned |
| `collab:note_deleted` | `trip:{id}` | `{ tripId, noteId }` | Shared note deleted |
| `collab:poll_new` | `trip:{id}` | `{ tripId, poll }` | Trip collab poll created |
| `collab:poll_voted` | `trip:{id}` | `{ tripId, pollId }` | Vote recorded on trip poll |
| `collab:poll_closed` | `trip:{id}` | `{ tripId, pollId }` | Trip poll closed |
| `circle:message` | `circle:{id}` | `{ circleId, message }` | Circle chat message |
| `circle:reaction` | `circle:{id}` | `{ circleId, messageId, emoji }` | Circle message reaction toggled |
| `circle:message_deleted` | `circle:{id}` | `{ circleId, messageId }` | Circle message soft-deleted |
| `circle:poll_new` | `circle:{id}` | `{ circleId, poll }` | Circle poll created |
| `circle:poll_voted` | `circle:{id}` | `{ circleId, pollId }` | Vote on circle poll |
| `circle:poll_closed` | `circle:{id}` | `{ circleId, pollId }` | Circle poll closed |
| `circle:member_joined` | `circle:{id}` | `{ circleId, userId }` | New circle member |
| `circle:member_left` | `circle:{id}` | `{ circleId, userId }` | Member left/removed |
| `notification:new` | `user:{id}` | `{ notification }` | New notification |
| `notification:updated` | `user:{id}` | `{ notificationId, changes }` | Notification updated |
| `user:online` | `user:{id}` | `{ userId }` | (presence, opt-in) |
| `user:offline` | `user:{id}` | `{ userId }` | (presence, opt-in) |
| `system:notice` | all | `{ notice }` | Admin system notice |
| `error` | — | `{ code, message }` | Auth fail, room access denied |

### Reconnect contract

1. Client stores last-seen event timestamp per room.
2. On reconnect: send `{ type: "subscribe", rooms: [...], since: <timestamp> }`.
3. Server replays missed events since timestamp (up to 30 min backlog from `notifications` + `collab_messages`).

---

## 22. V1 → V2 Endpoint Migration Reference

> V1 routes are listed here for cross-reference only. V2 routes are written from scratch.

| V1 endpoint | V2 equivalent | Notes |
|-------------|---------------|-------|
| `POST /api/auth/register` | `POST /api/v1/auth/register` | Same semantics |
| `POST /api/auth/login` | `POST /api/v1/auth/login` | Same semantics |
| `GET /api/auth/me` | `GET /api/v1/auth/me` | — |
| `GET /api/journals` | `GET /api/v1/posts?feed=global` | Renamed: journals → posts |
| `POST /api/journals` | `POST /api/v1/posts` | Expanded schema |
| `GET /api/journals/:id` | `GET /api/v1/posts/:postId` | — |
| `POST /api/journals/:id/reaction` | `POST /api/v1/posts/:postId/reactions` | Now 5 reaction types |
| `GET /api/destinations` | `GET /api/v1/feed/destinations` | — |
| `GET /api/trip-planner` | `POST /api/v1/ai/plan` (via FastAPI) | Completely rebuilt |
| `GET /api/flights` | `GET /api/v1/travel/flights` | Now Amadeus, not SerpAPI |
| `GET /api/hotels` | `GET /api/v1/travel/hotels` | Now Amadeus, not SerpAPI |
| `GET /api/meetways` | `GET /api/v1/circles` | Renamed: meetways → circles |
| `GET /api/justsplit/groups` | `GET /api/v1/expenses/groups` | Same concept, fresh code |
| `GET /api/notifications` | `GET /api/v1/notifications` | Extended with prefs + respond |
| `GET /api/profile/:id` | `GET /api/v1/users/:username` | — |
| `POST /api/follow/:id` | `POST /api/v1/users/:userId/follow` | — |
