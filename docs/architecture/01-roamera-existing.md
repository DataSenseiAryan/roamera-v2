# 01 — Roamera V1: Architecture Deep-Dive

> Source: `backend/` · `frontend/` · `mobile/`
> Live app: **roamera.in**

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    Browser["Browser (React 19 + Vite)"]
    RNApp["Mobile App (React Native 0.72)"]
    Express["Express 5 API :3001"]
    Prisma["Prisma ORM"]
    Postgres["PostgreSQL :5432"]
    Cloudinary["Cloudinary (image CDN)"]
    Claude["Anthropic Claude (AI Planner)"]
    SerpAPI["SerpAPI (flights + hotels)"]
    Gmail["Gmail SMTP (email verify)"]
    Disk["uploads/ (local fallback)"]

    Browser -->|"REST /api (Vite proxy)"| Express
    RNApp -->|"REST https://roamera.in/api"| Express
    Express --> Prisma --> Postgres
    Express -->|"multer (prod)"| Cloudinary
    Express -->|"multer (dev)"| Disk
    Express -->|"POST /ai-planner/generate"| Claude
    Express -->|"SerpAPI calls"| SerpAPI
    Express -->|"Nodemailer"| Gmail
```

---

## 2. Backend Route Table

**Server entry:** `backend/src/index.js`
**All paths prefixed with `/api`**

### 2.1 Auth — `backend/src/routes/auth.js` → `/api/auth`

| Method | Path | Auth | Body / Query | Returns |
|--------|------|------|--------------|---------|
| POST | `/register` | None | `{ username, email, password }` | `201 { user, requiresVerification: true }` |
| GET | `/verify-email` | None | `?token=` | `{ user, token }` — JWT on success |
| POST | `/resend-verification` | None | `{ email }` | `200` opaque or `400` already verified |
| POST | `/login` | None | `{ email, password }` (email or username) | `{ user, token }` or `403 { requiresVerification, email }` |

### 2.2 Journals — `backend/src/routes/journals.js` → `/api/journals`

| Method | Path | Auth | Body / Query | Returns |
|--------|------|------|--------------|---------|
| GET | `/feed` | None | `?page` (20/page) | Journal cards with parsed `photos`/`itinerary`, user summary, `_count` |
| GET | `/feed/following` | JWT | `?page` | Same shape, only from followed users |
| GET | `/:id` | None | — | Full journal + nested `comments` + users |
| POST | `/` | JWT | Multipart: `photos[]`, `title`, `destination`, `startDate`, `endDate`, `activities?`, `accommodation?`, `budget?`, `content?`, `itinerary?` | `201 Journal` |
| PUT | `/:id` | JWT (owner) | Multipart + `keepPhotos` JSON array | Updated journal |
| DELETE | `/:id` | JWT (owner) | — | `{ message: 'Deleted' }` |

### 2.3 Social — `backend/src/routes/social.js` → `/api` (no `/social` prefix)

| Method | Path | Auth | Body / Query | Returns |
|--------|------|------|--------------|---------|
| POST | `/journals/:id/like` | JWT | `{ type }` default `"love"` | `{ liked: boolean, type }` — `wanna_go` upserts BucketList |
| GET | `/bucket-list` | JWT | — | User's bucket items with nested journal |
| GET | `/journals/:id/likes` | None | — | `[{ user, type, createdAt }]` |
| POST | `/journals/:id/comments` | JWT | `{ content }` | `201 Comment + user` — notifies journal owner |
| DELETE | `/comments/:id` | JWT (author) | — | `{ message: 'Deleted' }` |
| POST | `/users/:id/follow` | JWT | — | `{ following: bool }` toggle — notifies target |
| GET | `/notifications` | JWT | — | Up to 30 notifications with actor, journal?, justsplitGroup? |
| GET | `/notifications/unread-count` | JWT | — | `{ count }` |
| PUT | `/notifications/read` | JWT | — | `{ ok: true }` marks all read |

### 2.4 Users — `backend/src/routes/users.js` → `/api/users`

| Method | Path | Auth | Body / Query | Returns |
|--------|------|------|--------------|---------|
| GET | `/me` | JWT | — | Current user + `_count` journals/followers/following |
| PUT | `/me` | JWT | Multipart `avatar?` + `{ username?, bio? }` | Updated profile |
| GET | `/:id` | None | — | Public profile + counts |
| GET | `/:id/journals` | None | `?page` | Journals with parsed photos |
| GET | `/:id/followers` | None | — | User list |
| GET | `/:id/following` | None | — | User list |

> `/me` routes are declared before `/:id` in the file to avoid wildcard capture.

### 2.5 Search — `backend/src/routes/search.js` → `/api/search`

| Method | Path | Auth | Query | Returns |
|--------|------|------|-------|---------|
| GET | `/` | None | `?q` | `{ journals, users }` — Prisma `contains` search |

### 2.6 Destinations — `backend/src/routes/destinations.js` → `/api/destinations`

| Method | Path | Auth | Query | Returns |
|--------|------|------|-------|---------|
| GET | `/categories` | None | — | Distinct category strings |
| GET | `/` | None | `?category` (optional) | All destinations, tags parsed JSON |
| GET | `/:id` | None | — | Single destination + tags |
| GET | `/:id/itinerary` | None | — | `{ destination, days[], nearby[] }` from hardcoded ITINERARIES map or `genericItinerary()` |

### 2.7 Hotels — `backend/src/routes/hotels.js` → `/api/hotels`

| Method | Path | Auth | Query | Returns |
|--------|------|------|-------|---------|
| GET | `/search` | None | `destination, checkin, checkout, guests` | SerpAPI `google_hotels` mapped list (INR, ~15 results); `503` if no `SERPAPI_KEY` |

### 2.8 Flights — `backend/src/routes/flights.js` → `/api/flights`

| Method | Path | Auth | Query | Returns |
|--------|------|------|-------|---------|
| GET | `/search` | None | `origin, destination, date, adults` | SerpAPI `google_flights` one-way results (INR); IATA resolved via `cityToIata.js` |

### 2.9 AI Planner — `backend/src/routes/aiPlanner.js` → `/api/ai-planner`

| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| POST | `/generate` | **None** ⚠️ | `{ destination, fromDate, toDate, activityPreferences[]?, companion? }` | Anthropic Claude JSON itinerary plan |

> Model: `claude-sonnet-4-6`. **No auth guard** — anyone can consume API quota.

### 2.10 Budget — `backend/src/routes/budget.js` → `/api/journals/:journalId/budget`

| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| GET | `/` | JWT | — | `{ entries[], totalSpent, totalBudget, currency: 'INR', byCategory }` |
| POST | `/` | JWT (owner) | `{ title, amount, category?, date?, notes? }` | New entry |
| PUT | `/:entryId` | JWT (owner) | Partial fields | Updated entry |
| DELETE | `/:entryId` | JWT (owner) | — | Deleted |

> ⚠️ GET allows **any** authenticated user to read any journal's budget (no ownership check).

### 2.11 Packing — `backend/src/routes/packing.js` → `/api/journals/:journalId/packing`

| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| GET | `/templates` | JWT | — | Built-in templates: `beach`, `mountain`, `city`, `general` |
| GET | `/` | JWT | — | All `PackingList` + items |
| POST | `/` | JWT (owner) | `{ name?, template? }` | New list (optionally seeded from template) |
| POST | `/:listId/items` | JWT (owner) | `{ name, category?, quantity?, essential?, notes? }` | New item |
| PATCH | `/:listId/items/:itemId/toggle` | JWT | — | Flip `packed` flag ⚠️ no ownership check |
| DELETE | `/:listId/items/:itemId` | JWT (owner) | — | Deleted |
| DELETE | `/:listId` | JWT (owner) | — | List deleted |

### 2.12 Meetways — `backend/src/routes/meetways.js` → `/api/meetways`

| Method | Path | Auth | Body / Query | Returns |
|--------|------|------|--------------|---------|
| GET | `/` | None | `?tag, budget, search, page` | List with `spotsTaken`, `spotsLeft` |
| GET | `/:id` | None | — | Detail + all participants + last 5 messages |
| POST | `/` | JWT | `{ title, destination, startDate, endDate, country?, description?, maxPeople?, budgetMin?, budgetMax?, tags[]?, privacy?, coverTheme?, itinerary[]? }` | `201` — host auto-added as approved |
| PUT | `/:id` | JWT (host) | Partial update including `status` | Updated meetway |
| DELETE | `/:id` | JWT (host) | — | Deleted |
| POST | `/:id/join` | JWT | — | Public→approved, private→pending; capacity check |
| DELETE | `/:id/leave` | JWT | — | Member leaves |
| PATCH | `/:id/participants/:userId` | JWT (host) | `{ status: 'approved' \| 'declined' }` | Updated participant |
| GET | `/:id/messages` | JWT | `?page` | Paginated chat (participants only) |
| POST | `/:id/messages` | JWT | `{ content }` | New message |
| GET | `/my/hosted` | JWT | — | Hosted meetways |
| GET | `/my/joined` | JWT | — | Joined as approved member |
| POST | `/:id/cover` | JWT (host) | Multipart `cover` | Updates `coverPhoto` |
| POST | `/:id/documents` | JWT (host) | Multipart `documents[]` | Appends to `documents` JSON array |

### 2.13 JustSplit — `backend/src/routes/justsplit.js` → `/api/justsplit`

| Method | Path | Auth | Body | Returns |
|--------|------|------|------|---------|
| GET | `/` | JWT | — | Groups where user is a member |
| POST | `/` | JWT | `{ name, description?, currency? }` | `201` group + creator as first member |
| GET | `/:groupId` | JWT | — | Full group for members; preview for non-members; includes net/debts |
| DELETE | `/:groupId` | JWT (owner) | — | Deleted |
| POST | `/:groupId/members` | JWT (member) | `{ username }` or `{ name }` for placeholder | Member added + notification |
| DELETE | `/:groupId/members/:memberId` | JWT (owner) | — | Member removed |
| POST | `/:groupId/request` | JWT | `{ message? }` | Join request + owner notified |
| PUT | `/:groupId/requests/:requestId` | JWT (owner) | `{ action: 'approve' \| 'decline' }` | Updates request; approve creates member |
| POST | `/:groupId/expenses` | JWT (member) | `{ title, amount, paidByMemberId, category?, date?, notes?, splitAmong? }` | New expense |
| DELETE | `/:groupId/expenses/:expenseId` | JWT (member) | — | Deleted |
| POST | `/:groupId/settle` | JWT (member) | `{ fromMemberId, toMemberId, amount, note? }` | Settlement recorded |

---

## 3. Prisma Data Model

**File:** `backend/prisma/schema.prisma` · **Database:** PostgreSQL

```mermaid
erDiagram
    User {
        Int id PK
        String username UK
        String email UK
        String password
        String avatar
        String bio
        Boolean emailVerified
        String verificationToken UK
        DateTime verificationTokenExpiry
        DateTime createdAt
    }
    Journal {
        Int id PK
        Int userId FK
        String title
        String destination
        DateTime startDate
        DateTime endDate
        String activities
        String accommodation
        Float budget
        String photos
        String itinerary
        String content
        DateTime createdAt
        DateTime updatedAt
    }
    Like {
        Int id PK
        Int userId FK
        Int journalId FK
        String type
        DateTime createdAt
    }
    Comment {
        Int id PK
        Int userId FK
        Int journalId FK
        String content
        DateTime createdAt
    }
    Follow {
        Int id PK
        Int followerId FK
        Int followingId FK
        DateTime createdAt
    }
    BucketList {
        Int id PK
        Int userId FK
        String destination
        Int journalId FK
        DateTime createdAt
    }
    Notification {
        Int id PK
        Int userId FK
        Int actorId FK
        String type
        Int journalId FK
        Int justsplitGroupId FK
        Boolean read
        DateTime createdAt
    }
    Destination {
        Int id PK
        String name
        String country
        String description
        String coverImage
        String category
        String tags
        DateTime createdAt
    }
    BudgetEntry {
        Int id PK
        Int journalId FK
        Int userId FK
        String title
        Float amount
        String category
        DateTime date
        String notes
        DateTime createdAt
    }
    PackingList {
        Int id PK
        Int journalId FK
        String name
        DateTime createdAt
    }
    PackingItem {
        Int id PK
        Int packingListId FK
        String name
        String category
        Int quantity
        Boolean essential
        Boolean packed
        String notes
        Int orderIndex
    }
    JustSplitGroup {
        Int id PK
        String name
        String description
        String currency
        Int createdById FK
        DateTime createdAt
    }
    JustSplitMember {
        Int id PK
        Int groupId FK
        Int userId FK
        String name
    }
    JustSplitJoinRequest {
        Int id PK
        Int groupId FK
        Int userId FK
        String status
        String message
        DateTime createdAt
    }
    JustSplitExpense {
        Int id PK
        Int groupId FK
        Int paidByMemberId FK
        String title
        Float amount
        String category
        DateTime date
        String notes
        DateTime createdAt
    }
    JustSplitSplit {
        Int id PK
        Int expenseId FK
        Int memberId FK
        Float shareAmount
    }
    JustSplitSettlement {
        Int id PK
        Int groupId FK
        Int fromMemberId FK
        Int toMemberId FK
        Float amount
        String note
        DateTime createdAt
    }
    Meetway {
        Int id PK
        Int hostId FK
        String title
        String destination
        String country
        DateTime startDate
        DateTime endDate
        String description
        Int maxPeople
        Float budgetMin
        Float budgetMax
        String tags
        String privacy
        String coverTheme
        String coverPhoto
        String itinerary
        String documents
        String status
        DateTime createdAt
        DateTime updatedAt
    }
    MeetwayParticipant {
        Int id PK
        Int meetwayId FK
        Int userId FK
        String role
        String status
        DateTime joinedAt
    }
    MeetwayMessage {
        Int id PK
        Int meetwayId FK
        Int userId FK
        String content
        DateTime createdAt
    }

    User ||--o{ Journal : "writes"
    User ||--o{ Like : "reacts"
    User ||--o{ Comment : "posts"
    User ||--o{ Follow : "follows (as follower)"
    User ||--o{ Follow : "followed (as following)"
    User ||--o{ BucketList : "saves"
    User ||--o{ Notification : "receives"
    User ||--o{ Notification : "triggers"
    User ||--o{ BudgetEntry : "logs"
    User ||--o{ JustSplitGroup : "creates"
    User ||--o{ JustSplitMember : "member"
    User ||--o{ JustSplitJoinRequest : "requests"
    User ||--o{ Meetway : "hosts"
    User ||--o{ MeetwayParticipant : "participates"
    User ||--o{ MeetwayMessage : "sends"
    Journal ||--o{ Like : "receives"
    Journal ||--o{ Comment : "receives"
    Journal ||--o{ Notification : "referenced"
    Journal ||--o{ BucketList : "saved"
    Journal ||--o{ BudgetEntry : "has"
    Journal ||--o{ PackingList : "has"
    PackingList ||--o{ PackingItem : "contains"
    JustSplitGroup ||--o{ JustSplitMember : "has"
    JustSplitGroup ||--o{ JustSplitExpense : "has"
    JustSplitGroup ||--o{ JustSplitSettlement : "has"
    JustSplitGroup ||--o{ JustSplitJoinRequest : "has"
    JustSplitGroup ||--o{ Notification : "referenced"
    JustSplitExpense ||--o{ JustSplitSplit : "split into"
    JustSplitMember ||--o{ JustSplitExpense : "pays"
    JustSplitMember ||--o{ JustSplitSplit : "owes"
    JustSplitMember ||--o{ JustSplitSettlement : "pays (from)"
    JustSplitMember ||--o{ JustSplitSettlement : "receives (to)"
    Meetway ||--o{ MeetwayParticipant : "has"
    Meetway ||--o{ MeetwayMessage : "has"
```

### JSON-string fields (stored as TEXT, parsed in route handlers)

| Model | Field | Actual shape |
|-------|-------|-------------|
| Journal | `photos` | `string[]` of Cloudinary/local URLs |
| Journal | `itinerary` | `{ day: number, title: string, activities: string[] }[]` |
| Meetway | `tags` | `string[]` |
| Meetway | `itinerary` | `{ day: number, title: string, activities: string[] }[]` |
| Meetway | `documents` | `{ name: string, url: string }[]` |
| Destination | `tags` | `string[]` |

---

## 4. Frontend Pages

**File:** `frontend/src/App.jsx`
**Framework:** React 19 + Vite + react-router-dom v7
**Auth guard:** unauthenticated non-auth routes → `/welcome` (first visit) or `/login`

### Auth pages (no shell chrome — no Navbar/BottomNav/SpaceBackground)

| Route | File | Description |
|-------|------|-------------|
| `/welcome` | `Onboarding.jsx` | First-visit welcome screen. Sets `roamera_onboarded` in localStorage. No API calls. |
| `/login` | `Login.jsx` | Email/password form → `POST /auth/login` |
| `/register` | `Register.jsx` | Username + email + password → `POST /auth/register` |
| `/verify-email` | `VerifyEmail.jsx` | Token from URL + resend option → `GET /auth/verify-email?token=`, `POST /auth/resend-verification` |

### Core / feed

| Route | File | Description |
|-------|------|-------------|
| `/` | `Feed.jsx` | Home. Public vs Following tabs with infinite scroll. Hero banner. Trending destinations anchor. JournalCard grid. Hits `GET /journals/feed?page` and `GET /journals/feed/following?page`. |

### Journals

| Route | File | Description |
|-------|------|-------------|
| `/journals/:id` | `JournalDetail.jsx` | Photo carousel, day-by-day itinerary timeline, rich text story, reaction buttons (❤️ 🔥 📍), comment list, owner actions (edit/delete/budget/packing). Hits `GET /journals/:id`, `GET /journals/:id/likes`, `POST /journals/:id/like`, `POST /journals/:id/comments`, `DELETE /journals/:id`. |
| `/journals/:id/edit` | `JournalForm.jsx` | Edit existing journal (same component as create). Pre-fills from `GET /journals/:id`. |
| `/journals/:id/budget` | `JournalBudget.jsx` | Expense tracker for the journal. Recharts pie chart by category. Add/delete entries. Hits `GET /journals/:id/budget`, `POST .../budget`, `DELETE .../budget/:entryId`. |
| `/journals/:id/packing` | `JournalPacking.jsx` | Packing list management. Template selector. Toggle packed state. Hits full packing route set. |
| `/create` | `JournalForm.jsx` | New journal with multi-photo upload (up to 5 images). |

### Users & social

| Route | File | Description |
|-------|------|-------------|
| `/users/:id` | `Profile.jsx` | Self vs other profile. Follow button, followers modal, journal grid, bucket list tab (saved 📍 journals), hosted meetways management (close/delete), edit profile form when self. |
| `/search` | `Search.jsx` | Combined users + journals search → `GET /search?q=`. |

### Planning / AI

| Route | File | Description |
|-------|------|-------------|
| `/plan/:destination` | `PlanTrip.jsx` | Destination planning page with hotel widget. Hits `GET /hotels/search`. |
| `/ai-planner` | `AIPlanTrip.jsx` | Conversational AI trip planner form. Destination, dates, preferences, companion type → `POST /ai-planner/generate`. Renders day-by-day itinerary result. |
| `/itinerary/:id` | `Itinerary.jsx` | Static rich itinerary viewer for a seeded destination → `GET /destinations/:id/itinerary`. |

### TravelLens

| Route | File | Description |
|-------|------|-------------|
| `/travellens` | `TravelLens.jsx` | Flights + Hotels tabs. Flights: `GET /flights/search`. Hotels: `GET /hotels/search`. Results with pricing in INR. |

### JustSplit

| Route | File | Description |
|-------|------|-------------|
| `/justsplit` | `JustSplit.jsx` | Group list + create form. Hits `GET /justsplit`, `POST /justsplit`. |
| `/justsplit/:id` | `JustSplitDetail.jsx` | Full group detail. Balances/debts summary, expense list, settlement form, member management, join request flow for non-members. |

### Meetways

| Route | File | Description |
|-------|------|-------------|
| `/meetways` | `Meetways.jsx` | Discover page with filters (tags, budget). Join action. |
| `/meetways/create` | `CreateMeetway.jsx` | Create meetway form with cover upload, document upload, optional journal prefill. |
| `/meetways/:id/edit` | `EditMeetway.jsx` | Host edit form. |
| `/meetways/:id` | `MeetwayDetail.jsx` | Full meetway view: hero, participant list, host approval panel, itinerary, documents, real-time chat (polling). ⚠️ Leave action calls wrong endpoint — see `docs/architecture/05-gaps-and-bugs.md`. |

### Shared components

| File | Role |
|------|------|
| `Navbar.jsx` | Top bar: logo, theme toggle (🌙/☀️), notification bell with unread badge, profile link. Fetches `GET /notifications/unread-count`. |
| `BottomNav.jsx` | Floating pill navigation: Compass (feed), Meetways, Flights (TravelLens), JustSplit, Miles/Profile. Mobile-first. |
| `JournalCard.jsx` | Feed card with photo carousel, reaction counts, action menu (Create Meetway, ⚠️ links to `/meetways` not `/ai-planner`). |
| `SearchOverlay.jsx` | Quick search modal on mobile bottom nav. |
| `ConfirmDialog.jsx` | Reusable destructive-action dialog. |
| `SpaceBackground.jsx` | Ambient animated background (stars + particles). Only shown on authenticated routes. |
| `TrendingDestinations.jsx` | Horizontal carousel. Hits `GET /destinations` and `GET /destinations/categories`. |

### Contexts

| File | What it provides |
|------|-----------------|
| `context/AuthContext.jsx` | `user`, `loading`, `login()`, `logout()`. Bootstraps from `GET /users/me` with stored token. |
| `context/ThemeContext.jsx` | `theme` (`night` | `day`), `toggleTheme()`. Writes `data-theme` attribute to `<html>`. Persisted in localStorage. |

---

## 5. Mobile App Screens

**Framework:** React Native 0.72 (no Expo), `@react-navigation/native`
**File:** `mobile/src/navigation/AppNavigator.js`
**API base:** `https://roamera.in/api` (hardcoded — update for local dev in `mobile/src/lib/api.js`)

### Bottom tabs (authenticated)

| Tab | Screen | Emoji | Description |
|-----|--------|-------|-------------|
| Explore | `FeedScreen.js` | 🧭 | Travel feed with destinations slice + journals |
| Meetways | `MeetwaysScreen.js` | 🗺️ | Discover + join meetways |
| Flights | `TravelLensScreen.js` | ✈️ | Flights + hotels search |
| JustSplit | `JustSplitScreen.js` | 💰 | Expense groups |
| Profile | `ProfileScreen.js` | 👤 | Self profile + stats |

### Stack screens (pushed on top of tabs)

| Screen | Navigator name | Description |
|--------|---------------|-------------|
| `JournalDetailScreen.js` | `JournalDetail` | Journal with reactions/comments |
| `CreateJournalScreen.js` | `CreateJournal` | New journal form |
| `SearchScreen.js` | `Search` | Search users + journals |
| `NotificationsScreen.js` | `Notifications` | Notification feed |
| `UserProfileScreen.js` | `UserProfile` | Other user's profile + follow |
| `JournalBudgetScreen.js` | `JournalBudget` | Per-journal budget tracker |
| `JournalPackingScreen.js` | `JournalPacking` | Packing lists |
| `MeetwayDetailScreen.js` | `MeetwayDetail` | Meetway detail + chat |
| `CreateMeetwayScreen.js` | `CreateMeetway` | Create meetway |
| `AIPlannerScreen.js` | `AIPlanner` | AI trip planner |
| `JustSplitDetailScreen.js` | `JustSplitDetail` | Group expense detail |

### Unauthenticated stack

| Screen | Navigator name |
|--------|---------------|
| `auth/LoginScreen.js` | `Login` |
| `auth/RegisterScreen.js` | `Register` |

### Screens that exist but are NOT wired into the navigator

| Screen | Status |
|--------|--------|
| `BucketListScreen.js` | File exists, not registered in `AppNavigator.js` |

### Feature parity vs web

| Feature | Web | Mobile |
|---------|:---:|:------:|
| Feed (public + following) | ✅ | ✅ (Explore tab) |
| Journal create/detail/reactions | ✅ | ✅ |
| Journal edit | ✅ | ❌ not in navigator |
| Budget tracker | ✅ | ✅ |
| Packing lists | ✅ | ✅ |
| Search | ✅ | ✅ |
| Notifications | ✅ (Navbar) | ✅ (stack screen) |
| Profile + follow | ✅ | ✅ |
| Bucket list | ✅ (Profile tab) | ❌ screen not wired |
| Meetways discover/join/detail | ✅ | ✅ |
| Create meetway | ✅ | ✅ |
| Edit meetway | ✅ | ❌ not in navigator |
| Meetways chat | ✅ (polling) | ✅ (MeetwayDetail) |
| AI trip planner | ✅ | ✅ |
| TravelLens (flights + hotels) | ✅ | ✅ (flights focus) |
| JustSplit full | ✅ | ✅ (detail slimmer) |
| Onboarding welcome | ✅ | ❌ no equivalent |
| Email verification | ✅ | ❌ no screen |

---

## 6. Auth Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant BE as Backend
    participant DB as PostgreSQL
    participant Email as Gmail SMTP

    U->>FE: POST /register { username, email, password }
    FE->>BE: POST /api/auth/register
    BE->>DB: Create User (emailVerified=false, token=uuid)
    DB-->>BE: User created
    BE->>Email: Send verification link (APP_URL/verify-email?token=...)
    BE-->>FE: 201 { user, requiresVerification: true }
    FE-->>U: "Check your email"

    U->>FE: Click email link
    FE->>BE: GET /api/auth/verify-email?token=...
    BE->>DB: Set emailVerified=true, clear token
    DB-->>BE: Updated
    BE-->>FE: { user, token (JWT, 7d) }
    FE-->>U: Logged in

    U->>FE: POST /login { email, password }
    FE->>BE: POST /api/auth/login
    BE->>DB: Find user by email OR username
    BE->>BE: bcrypt.compare(password, hash)
    alt emailVerified=false
        BE-->>FE: 403 { requiresVerification: true, email }
    else
        BE-->>FE: 200 { user, token (JWT, 7d) }
        FE->>FE: Store token, set AuthContext user
    end
```

---

## 7. Environment Variables

**File:** `backend/.env.example` (+ additional vars seen in code)

| Variable | Required | Used in | Notes |
|----------|----------|---------|-------|
| `DATABASE_URL` | ✅ | `prisma.js` | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ | `middleware/auth.js` | Any random string |
| `PORT` | No | `index.js` | Default `3001` |
| `APP_URL` | ✅ (email) | `mailer.js` | Base URL for verification links; fallback `localhost:5200` |
| `SMTP_HOST` | ✅ (email) | `mailer.js` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | ✅ (email) | `mailer.js` | `587` |
| `SMTP_USER` | ✅ (email) | `mailer.js` | Gmail address |
| `SMTP_PASS` | ✅ (email) | `mailer.js` | Gmail App Password |
| `ANTHROPIC_API_KEY` | Optional | `aiPlanner.js` | Claude Sonnet 4.6 |
| `SERPAPI_KEY` | Optional | `hotels.js`, `flights.js` | Required for TravelLens; **missing from `.env.example`** |
| `CLOUDINARY_CLOUD_NAME` | Optional | `upload.js` | Falls back to disk |
| `CLOUDINARY_API_KEY` | Optional | `upload.js` | |
| `CLOUDINARY_API_SECRET` | Optional | `upload.js` | |
| `FRONTEND_URL` | Optional | `.env.example` | Referenced in example but **not used** in any route |
| `RAPIDAPI_KEY` | Optional | `.env.example` | Listed but **not used** in any backend route |
| `AMADEUS_CLIENT_ID` | Unused | `amadeus.js` | Dead code — lib file exists but is never required |
| `AMADEUS_CLIENT_SECRET` | Unused | `amadeus.js` | Dead code |

**Frontend:** Only `VITE_API_URL` (optional — Vite dev proxy handles `/api` automatically).

---

## 8. External Services & Dependencies

| Service | SDK / library | Purpose |
|---------|---------------|---------|
| **Anthropic Claude** | `@anthropic-ai/sdk` | AI trip itinerary generation (`claude-sonnet-4-6`) |
| **SerpAPI** | `axios` (direct) | Google Flights + Google Hotels search |
| **Cloudinary** | `cloudinary` + `multer-storage-cloudinary` | Image hosting (journal photos, meetway covers, avatars) |
| **Gmail SMTP** | `nodemailer` | Email verification links |
| **OpenAI** | `openai` package | **Dead dependency** — listed in `package.json` but not imported anywhere |
| **Amadeus** | Custom client in `amadeus.js` | **Dead code** — file exists, no route imports it |

---

## 9. Implemented Features Summary

### Auth & Identity
- Register with email + username + password (bcrypt)
- JWT auth (7-day expiry), stored in localStorage (web) / AsyncStorage (mobile)
- Email verification via Gmail SMTP (required before login)
- Profile: username, bio, avatar upload (Cloudinary)

### Social
- Follow / unfollow users (toggle)
- Multi-type reactions on journals: ❤️ Love · 🔥 Epic · 📍 Wanna Go
  - `wanna_go` saves journal to user's bucket list
- Comments on journals
- Notification system: reaction, comment, follow, JustSplit invite events
- Personalized feed (following) + global feed (all journals)
- Bucket list from 📍 reactions (web profile tab)

### Journals (Moments)
- Create with up to 5 photos (multipart upload)
- Fields: title, destination, start/end dates, activities, accommodation, budget, content (rich text), itinerary (JSON day-plans)
- Photo carousel on detail page
- Day-by-day itinerary timeline
- Edit and delete (owner only)

### AI Trip Planner
- Claude Sonnet 4.6 generates structured day-by-day itinerary
- Inputs: destination, date range, activity preferences, companion type
- Output: JSON plan rendered as timeline

### TravelLens
- Flight search: city name → IATA via `cityToIata.js` → SerpAPI Google Flights (one-way, INR)
- Hotel search: destination, check-in/out, guests → SerpAPI Google Hotels (INR, ~15 results)

### Meetways (Travel Circles)
- Create: title, destination, dates, budget range, tags, max people, public/private, itinerary, cover, documents
- Join (public: instant, private: pending approval)
- Host controls: approve/decline participants, close meetway, edit, delete
- Group chat (REST polling — no WebSocket)
- Cover photo + document attachments

### JustSplit (Expense Splitting)
- Groups with optional currency (default USD ⚠️ — app is INR-focused)
- Members: link to app user OR create placeholder by name
- Expenses with paid-by, category, flexible split amounts
- Auto-calculated net balances and debt graph
- Settlement recording
- Join request → owner approval flow
- Notifications for invites

### Per-Journal Budget Tracker
- Expense entries with category + date + notes
- Total spent vs journal budget field
- Category breakdown (pie chart via Recharts on web)

### Packing Lists
- Multiple lists per journal
- Items: name, category, quantity, essential flag, packed toggle, notes
- Order index for sorting
- Built-in templates: beach, mountain, city, general

### Destinations & Discovery
- Seeded destination catalog (30 destinations, categories, tags)
- Trending destinations carousel on home
- Filters by category
- Per-destination static itinerary

### Search
- Full-text search on journal title/destination + username (Prisma `contains`, case-insensitive)

### Onboarding
- Web-only first-visit welcome screen (localStorage gate)
