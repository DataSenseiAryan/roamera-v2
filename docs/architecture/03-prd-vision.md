# 03 — Roamera PRD Vision

> Sources: `Roamera.in.docx` · `Roamera.in.txt`
> This document captures the full product vision for the Roamera/Pack&Go super-app.
> It represents where we want to go — not what is built yet.

---

## 1. Mission & Motto

> **"Pack&Go — you travel impromptu, cuz we plan."**

Roamera is a **travel super-app** for the Indian market with global ambitions, combining:
- AI-powered itinerary planning
- Social travel journaling (posts, stories, reels)
- Group travel coordination (Travel Circles)
- Marketplace for curated trips and experiences
- Workation discovery
- Smart expense splitting (with UPI/Indian payment methods)
- Gamification and travel graphs

---

## 2. Brand & Naming

### Section names (web)

| Generic concept | Roamera brand name | Icon/Emoji |
|-----------------|--------------------|-----------|
| Feed / Home | **Compass** | 🧭 |
| Post / Share | **Moments** | 📸 |
| Story | **Trails** | 🛤️ |
| Highlight reel | **Miles** | 🪙 |
| Reel / Video | **Vlog** | 🎬 |
| Saved | **Wanna Go** | 📍 |
| Fellow users | **Fellow Travelers** | |

### Section names (mobile — Journey screen)

On mobile, a special "Journey" content type exists:
- **Title** — name of the journey
- **Start location** — origin
- **Route** — path taken
- **Days** — duration
- **Budget** — ₹ spent
- **Photos** — gallery
- **Tips** — travel advice for others

### Reaction set

| Emoji | Label | DB key | Behavior |
|-------|-------|--------|----------|
| ❤️ | Love | `love` | Standard like |
| 🔥 | Epic | `epic` | High-energy endorsement |
| 🌍 | Wander | `wander` | Inspiration to explore — **NEW** |
| 📍 | Wanna Go | `wanna_go` | Saves to bucket list |
| 🤩 | Amazing | `amazing` | Discovery delight — **NEW** |

> The current V1 codebase supports `love`, `epic`, `wanna_go`. The PRD adds `wander` and `amazing`.
> All 5 reactions should be implemented.

---

## 3. Design System

### Visual identity

| Token | Value |
|-------|-------|
| **Primary color** | Teal (`#0D9488` or similar) |
| **Accent color** | Coral / warm orange |
| **Neutral** | Slate gray |
| **Border radius** | `rounded-2xl` (16px) — generous curves |
| **Cards** | Soft shadows, white/dark surface, generous padding |
| **Overlays** | Glassy (backdrop-blur + semi-transparent) |
| **Gradients** | Subtle, brand colors |

### Themes

- **Light mode** — clean white/slate
- **Dark mode** — deep navy/slate (full dark support)
- Matching browser/app status bar color
- Theme persisted in user preferences

### Motion & micro-interactions

- **Page transitions:** slide/fade between routes
- **Button/CTA hover:** spring scale animations (Framer Motion)
- **Story viewer:** progress bar sweep animation
- **Pull-to-refresh:** mobile bounce spring
- **Cards:** subtle lift on hover (web)
- **Reaction burst:** emoji pop animation on react

### Responsive layout

- **Mobile-first** breakpoints
- **Web desktop:** App shell with topbar + left nav rail + main content + optional right contextual panel
- **Web mobile / tablet:** Single column, bottom tab bar
- **Mobile app:** Bottom tabs + modal overlays + pull-to-refresh
- **Safe area handling** on iOS

### Typography

- Modern sans-serif
- Emoji-friendly rendering
- INR (₹) currency throughout for Indian market

---

## 4. Core Screens

### Screen 1: Onboarding & Auth

**Purpose:** First impression, account creation, preference capture

**Flow:**
1. Splash / welcome screen with Roamera branding
2. Auth choice: Phone OTP or Email OTP (passwordless, no passwords)
3. OTP entry screen
4. Profile setup (after first OTP verify):
   - Home city
   - Budget band (backpacker / mid-range / luxury)
   - Travel interests: Treks, Cafes, Culture, Beaches, Food, Adventure, etc.
5. Redirect to Compass (home)

**Key UX:** Smooth onboarding in <3 taps. Interests used to personalize initial feed.

---

### Screen 2: Compass (Home / Discover)

**Purpose:** Main discovery hub — social feed + curated content

**Content card types in the feed:**
- AI Planner CTA card (persistent at top)
- Moments (journal posts) from Following
- Curated trips (brand accounts / influencers)
- Travel Circles near you
- Experiences & Events (nearby + upcoming)
- Workation listings

**UI elements:**
- Stories bar at top (Trails from followed users)
- Post new Moment / Trail / Vlog button (FAB or top-right)
- Notification bell
- Favourites / saved list access
- Search (triggers SearchOverlay)
- Infinite scroll

**Feed content per card:**
- Image grid (3–5 photos for Moments)
- Location: start location, pit stops, end location
- Reactions: ❤️ 🔥 🌍 📍 🤩
- Save button (save itinerary / duplicate itinerary)
- Comments count

---

### Screen 3: AI Planner (Conversational)

**Purpose:** The flagship AI-powered trip planning experience

**UI:**
- Chat-like interface (bubbles, typing indicators)
- User prompt examples: "5 days Bali, ₹50k, adventure + cafes"
- AI reply: structured day-by-day itinerary with POIs, timings, budget estimates

**Sidebar / constraint panel:**
- Date range picker
- Budget slider
- Visa requirements (auto-checked)
- Weather at destination (live)
- Flights availability (SerpAPI)
- Hotels availability (SerpAPI)
- Activity filters (checkboxes: treks / food / culture / beaches)

**Action buttons on AI result:**
- "Refine" — tweak the plan via follow-up message
- "Shuffle Day" — regenerate one day's plan
- "Optimize Budget" — AI suggests budget cuts
- "Book Pieces" — link to TravelLens for booking

**Save & share:**
- Save itinerary to profile
- Share as Moment (post)
- Export to calendar

---

### Screen 4: Marketplace

**Purpose:** Browse and book curated trips organized by brands, influencers, travel agencies

**Filters:**
- Date range
- Budget range
- Theme: Trekking / Festival / Food / Beach / Adventure / Culture
- Organizer type: Brand / Influencer / Agency / Community

**Listing card:**
- Cover photo
- Title + destination
- Duration + price
- Organizer avatar + name
- Theme tags
- Availability (spots left)

**Listing detail:**
- Itinerary snippet (day-by-day preview)
- Inclusions list (flights / hotel / meals / guide)
- Interactive map with stops
- Host/organizer profile
- Reviews / social proof
- **Join / Book CTA** (with payment flow)

---

### Screen 5: Travel Circles (Group Travel)

**Purpose:** BlaBlaCar for leisure travel — create or join peer-organized group trips

**Analogous to:** Meetways in V1, but richer

**Create circle:**
- Destination + dates + description
- Budget range
- Max members
- Tags (vibe: chill / party / culture / adventure)
- Privacy: public or invite-only
- Cover photo

**Circle detail:**
- Members list with avatars + roles
- Group itinerary (linked from AI Planner or manual)
- **Group chat** (realtime via WebSocket)
- **Decision polls** ("Should we do Bali or Phuket?")
- **Expense group link** (connects to JustSplit/Expenses)
- "Add to Circle" from trip itinerary

---

### Screen 6: Experiences & Events

**Purpose:** Aggregated local experiences from external platforms

**Sources to aggregate:**
- BookMyShow (India)
- Ticketmaster (global)
- Meetup (community events)

**Card format:**
- Event name + photo
- Date / time
- Location
- Price (INR)
- Category tags: Concert / Workshop / Festival / Sports / Food

**UX:** Filter by date, category, price. Click through to external booking.

---

### Screen 7: Workations

**Purpose:** Discover locations and properties for working remotely while traveling

**Listing fields:**
- Location / city
- Property photos
- Wi-Fi speed (Mbps)
- Desk setup photos
- Community vibe description
- Cost per day / week / month (₹)
- Amenities: coffee shop / coworking / pool / outdoor
- Availability (date picker)

**Filter:** By city, price, amenities, duration

---

### Screen 8: Trip Detail (Planner)

**Purpose:** Full interactive trip itinerary (ported from TREK_alt concepts)

**Features:**
- Multi-day timeline
- **Drag-and-drop reorder** of places within/between days
- **Interactive map** with POI pins at each stop
- **Weather badge** per day (Open-Meteo)
- Day notes (timestamped, icon-tagged)
- Attachments: flight tickets, hotel PDFs, receipts
- Reservation tracking (flight, hotel, restaurant)
- Day accommodations (check-in → check-out dates)

**Actions:**
- "Add to Circle" — share this trip with a Travel Circle
- "Invite friends" — send invite link
- "Export to calendar" — ICS file

---

### Screen 9: Expenses (JustSplit Enhanced)

**Purpose:** Group expense management with Indian payment context

**Improvements over V1 JustSplit:**
- Group ledger view (who paid what, who owes what)
- **SMS/receipt auto-parse stubs** (scan bill → auto-fill expense)
- Split modes:
  - Equal split
  - Weighted (custom percentages)
  - Rotating (who pays next)
- **Settlement buttons:**
  - UPI intent links (opens GPay / PhonePe / BHIM)
  - PayTM deep link
  - Cash settle
- Multi-currency support (not just USD)
- Per-expense category + notes

---

### Screen 10: Stories / Trails

**Purpose:** Instagram-style short-form story content for travel

**Story components:**
- Progress bars (auto-advance 5–15 seconds)
- Swipe navigation (left/right between stories)
- Swipe up to interact (save, share, react)
- Pinned places on a small map thumbnail
- People met (tag other travelers)
- **Share / Export** to WhatsApp, Instagram, etc.

**Story creation ("Add to Trails"):**
- Photo(s) or short video
- Location auto-tag
- AI auto-caption suggestion
- AI auto-hashtag suggestion
- Mood / vibe overlay

---

### Screen 11: Travel Graph & Gamification

**Purpose:** Personal travel stats dashboard + motivation through achievements

**Stats section:**
- Countries visited (world map)
- Cities visited
- Total km traveled (estimated)
- Travel companions (network graph)
- Total ₹ spent
- Yearly / monthly / all-time views

**Gamification — Badges:**
| Badge | Unlock condition |
|-------|-----------------|
| 🏔️ Trekker | Complete 3 trek journals |
| ☕ Culture Vulture | Visit 5 cities in 1 year |
| 🌿 Eco Explorer | Mark eco-friendly trips |
| 🛣️ Road Warrior | 3 road trips logged |
| 🌏 Globetrotter | Visit 5+ countries |
| 🎒 Backpacker | 10 budget trips |

**Leaderboards:**
- Friends leaderboard (most places visited this month)
- Community leaderboard (most journals posted)

**Yearly recap:** "2025 — You visited 12 cities, spent ₹2.1L, made 5 travel friends"

---

### Screen 12: Notifications

**Purpose:** Realtime awareness of everything happening around the user's trips

**Notification types:**
- New reaction / comment on your Moment
- Someone followed you
- Travel Circle: new member joined / host approved your request
- Circle chat: new message
- Poll result finalized
- Expense added to your group / settlement request
- Trip day starts tomorrow (reminder)
- Todo due date approaching

**UI:**
- Notification center (paginated list)
- Notification bell in header (unread count badge)
- **Realtime** (WebSocket push — not polling)
- Interactive notifications: "Accept / Decline" trip invite inline
- Per-type notification preferences (email, push, in-app)

---

### Screen 13: Profile & Settings

**Purpose:** User identity, saved content, and preferences

**Profile tabs:**
- **Moments** — journal posts grid
- **Trails** — stories archive
- **Miles** — highlights
- **Bucket List** — 📍 Wanna Go saves
- **Travel Stats** — mini travel graph (link to full screen)

**Profile header:**
- Avatar, username, bio, home city
- Follower / following counts
- Fellow Travelers suggestion (people you may know)

**Settings sections:**
- Edit profile (avatar, bio, home city, interests)
- Saved places
- Payment methods (UPI IDs, saved cards)
- Privacy controls (who sees my posts / location)
- Notification toggles (per-channel, per-type)
- Auth / security (linked phone, email, 2FA)
- Language / region
- App theme (light / dark)

---

## 5. Mobile-Specific UX Features

### Journey post creation (mobile)

A rich creation flow triggered when user taps "+" on Compass:

1. Select media (photos from gallery or camera)
2. **Auto-detect location** from photo metadata / GPS
3. **POV shot suggestions** (composition tips overlay)
4. **AI auto-caption** — generate caption from photo + location
5. **AI auto-hashtag** — suggest relevant hashtags
6. Add song (background music like Instagram Reels)
7. Vacation type selector:
   - Workation / Staycation / Expedition / Trek / Road Trip (bike / car)
8. Add hotel info, transport mode, weather, budget

### Smart suggestions (mobile)

After a user posts 3 Reels/Vlogs from the **same location**:
- System shows prompt: "You seem to love [Location]! Want to explore it more?"
  → Button: **Explore** (shows related content, nearby experiences)
- "Want to create an itinerary with map routes for [Location]?"
  → Button: **Plan It** (opens AI Planner pre-seeded with location)
- "Looking for a 3, 5, or 9-day itinerary?"
  → Redirect to Marketplace for curated itineraries

---

## 6. Target Tech Stack

Per the PRD's "Pack&Go" prompt (most specific version of the vision):

### Web

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 15** App Router + TypeScript |
| UI components | **shadcn/ui** (Radix UI + Tailwind) |
| Styling | **Tailwind CSS** (v4 or v3) |
| Animation | **Framer Motion** |
| State (server) | **TanStack Query** (React Query v5) |
| State (client UI) | **Zustand** |
| Validation | **Zod** |
| Routing | **Next.js App Router** |
| Auth | Email OTP (passwordless) — pluggable: Clerk / Supabase / Auth.js |
| Realtime | WebSocket or SSE client (Ably / Pusher / Socket.IO stubs) |
| Maps | Abstract map provider (swap Mapbox / Google); SSR-safe fallbacks |
| Charts | **Recharts** or **Visx** |
| PWA | **next-pwa** + Workbox |
| i18n | **next-intl** |
| Analytics | PostHog / GA4 (central `track()` util with typed events) |
| Testing | **Vitest** (unit) + **Playwright** (E2E) |

### Mobile

| Layer | Technology |
|-------|-----------|
| Framework | **Expo Router** (file-based routing) |
| UI | **tamagui** or **NativeWind** (Tailwind for React Native) |
| Animation | **Reanimated** |
| Navigation | Expo Router (file-based) |
| State | TanStack Query + Zustand |
| i18n | **i18next** |

### Backend (no change from V1 — keep and extend)

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Framework | Express (or Next.js API routes) |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + OTP adapter |
| File storage | Cloudinary |
| Email | Nodemailer / Resend |
| AI | Anthropic Claude |
| Search | SerpAPI |
| Realtime | `ws` (WebSocket) |

### Shared packages (monorepo)

| Package | Content |
|---------|---------|
| `packages/ui` | Cross-platform components (Tailwind + react-native-web compatible) |
| `packages/config` | tsconfig / eslint / prettier / tailwind config |
| `packages/types` | Shared DTOs + Zod schemas |
| `packages/sdk` | Typed API client with TanStack Query hooks |

---

## 7. Planned API Endpoints

(To be implemented — these are stubs from the PRD)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/auth/otp/start` | Send OTP to email/phone |
| POST | `/v1/auth/otp/verify` | Verify OTP → JWT |
| GET | `/v1/me` | Current user profile |
| POST | `/v1/ai/plan` | Input: `{ preferences, budget, dates }` → Output: `itinerary[]` with day/POIs |
| POST | `/v1/ai/refine` | Modify an existing AI-generated plan |
| GET | `/v1/marketplace/listings` | Filters: date, theme, budget |
| GET | `/v1/circles` | List public Travel Circles |
| POST | `/v1/circles` | Create a Travel Circle |
| POST | `/v1/circles/:id/join` | Join a circle |
| GET | `/v1/circles/:id/chat` | Circle chat history |
| GET | `/v1/experiences` | Aggregated events (BookMyShow + Ticketmaster + Meetup) |
| GET | `/v1/workations` | Workation listings |
| GET | `/v1/trips` | User's trips |
| POST | `/v1/trips` | Create trip |
| GET | `/v1/trips/:id` | Trip detail |
| GET | `/v1/expenses/groups` | Expense groups |
| POST | `/v1/expenses/groups` | Create expense group |
| POST | `/v1/expenses/settle` | Record settlement |
| GET | `/v1/gamification/graph` | Travel graph + stats |
| GET | `/v1/gamification/badges` | Earned badges |
| GET | `/v1/notifications` | Notification feed |

> These are **versioned** (`/v1/...`) unlike the current V1 backend which uses `/api/...`.
> In implementation, we should decide whether to version and whether to keep compatibility
> with the existing frontend.

---

## 8. Required DTOs / Data Types

(From PRD — to be implemented as Zod schemas in `packages/types`)

```typescript
User           // id, username, email, avatar, bio, homeCity, budgetBand, interests[], travelStats
Trip           // id, title, destination, dates, days, budget, coverImage, privacy
DayPlan        // tripId, dayNumber, date, places[], notes[], weather
POI            // name, lat, lng, address, category, price, duration, images[], rating
Listing        // id, title, organizer, destination, dates, price, theme, spots, itinerary[]
Circle         // id, name, destination, dates, members[], itinerary, chatId, expenseGroupId
Message        // id, circleId, userId, content, createdAt, replyTo
Poll           // id, circleId, question, options[], votes, multiple, closed
ExpenseGroup   // id, name, members[], expenses[], settlements[], debts[]
ExpenseItem    // id, groupId, paidBy, title, amount, category, splitAmong[]
Badge          // id, name, icon, description, unlockedAt
TravelGraph    // userId, countriesVisited[], citiesVisited[], totalKm, totalSpent, companions[], yearly[]
```

---

## 9. Component Scaffold (Key Components)

### Planner components
- `ChatBubble` — AI message bubble (user vs AI styles)
- `PromptComposer` — text input with send button + constraint chips
- `ConstraintChip` — budget / dates / weather / visa chips
- `DayTimeline` — vertical day-by-day plan with draggable POIs
- `ActionBar` — Refine / Shuffle / Optimize / Book buttons
- `SavePlanButton`, `SharePlanButton`

### Card components
- `ListingCard` — marketplace trip card
- `CircleCard` — Travel Circle discovery card
- `ExperienceCard` — event/experience card
- `WorkationCard` — remote work listing card
- `StoryCard` — Trail/story card
- `BadgeCard` — achievement card
- `MomentCard` — journal post card (photos + reactions)

### Map components
- `MapView` — abstract provider (Mapbox or Google) with SSR-safe fallback
- `POIPin` — customizable map pin with photo + label
- `RouteLayer` — line between POIs
- `ClusterMarker` — grouped pins

### Chat & Polls
- `MessageList` — virtual-scroll chat history
- `MessageComposer` — text input + attachment + send
- `PollWidget` — options with live result bars
- `ReactionPicker` — emoji reaction overlay

### Expenses
- `LedgerTable` — who owes whom
- `SplitEditorModal` — choose split mode + adjust amounts
- `SettlementCTA` — UPI intent / PayTM / cash buttons

### Story Viewer
- `StoryProgress` — auto-advance progress bars
- `StoryNavigation` — swipe gesture handler
- `StoryExport` — share to other apps

### Travel Graph
- `StatsCards` — countries / cities / km / spend
- `WorldMapChart` — visited countries choropleth
- `BadgeGrid` — achievement badges
- `LeaderboardRow` — rank + user + score

### Forms
- `PreferencesForm` — interests, budget band, home city (Zod-validated)
- `FilterPanel` — date range, budget, theme filters

---

## 10. Payments & UPI (Stubs)

Implementation level: **mock demo mode** initially

- `PaymentMethodSheet` — saved methods list + add new
- `UPIIntentLink` — mobile deep link: `upi://pay?pa=xxx&pn=xxx&am=xxx`
  - Opens: GPay / PhonePe / BHIM / Paytm on Android
- `RazorpayModal` — web checkout (Razorpay integration, demo mode)
- `StripeModal` — web checkout alternative (for international)

---

## 11. Offline & Sync Strategy

- Cache last viewed itinerary in IndexedDB (Dexie)
- Cache last 50 chat messages per circle
- **Optimistic updates** for:
  - Chat message sends
  - Poll votes
  - Expense entry adds
  - Reaction adds
- **Retry queue** for failed mutations (replayed on reconnect)
- Service Worker (Workbox) for:
  - App shell (always cached)
  - Static assets (CacheFirst)
  - API calls (NetworkFirst with fallback)
  - Map tiles (CacheFirst)

---

## 12. Google Stitch Design References

The PRD links to these mockup versions (internal Google Stitch project links — not publicly accessible but referenced for design decisions):

| Version | URL |
|---------|-----|
| Version 1 | https://stitch.withgoogle.com/projects/7558568502638301030 |
| Version 2 | https://stitch.withgoogle.com/projects/9758563103165334879 |
| Version 3 | https://stitch.withgoogle.com/projects/6555806581725141356 |
| Min screens | https://stitch.withgoogle.com/projects/10097423900105907925 |
| Figma | https://www.figma.com/make/49zHw5sOSWTaVyD3txDwP1/Implement-Feature |

---

## 13. Acceptance Criteria

From the PRD:

1. **Mobile, tablet, web responsive** layouts — no broken views at any common breakpoint
2. **Smooth micro-interactions** and fast navigation — no janky transitions
3. **Clear API boundaries** — TODOs in frontend code showing exactly where each real backend call will go
4. **Developer-friendly:** typed SDK, shared component library, documented architecture
5. **Backend pluggable:** frontend should work with mock data stubs so UI testing can start before backend is complete
6. **INR currency** throughout the expense and budget flows
7. **Indian payment methods** (UPI, PayTM) in settlement flows

---

## 14. Build Priorities (Stretch Goals)

These are nice-to-haves, not required for MVP:

- **Feature flags helper** — toggle features per environment
- **Error boundary pages** — graceful crash recovery with retry
- **Simple admin page** — toggle featured listings, view user reports
- **PDF export** of trip itinerary (learned from TREK)
- **MCP server** for AI assistant tools (learned from TREK)
- **PWA full offline** — installable, offline-first tile caching
