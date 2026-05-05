# 04 — Feature Matrix: Cross-Source Comparison

> Use this document to finalize the feature list for the next build iteration.
> For each row, decide: **Keep** (use V1 code) / **Port** (take from TREK) / **New** (build from PRD) / **Drop** / **Defer**.
>
> Column key:
> - **V1** = Roamera V1 (`backend/` + `frontend/` + `mobile/`)
> - **TREK** = TREK_alt reference codebase (`TREK_alt/`)
> - **PRD** = Product vision (`Roamera.in.docx` / `03-prd-vision.md`)
> - ✅ = Fully implemented · 🟡 = Partial / basic · ❌ = Not present · 🔧 = Planned / stub

---

## A. Auth & Identity

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Email + password register/login | ✅ | ✅ | ❌ (PRD wants OTP) | High | ⬜ |Keep
| bcrypt password hashing | ✅ | ✅ | — | High | ⬜ |Keep
| Email verification (SMTP) | ✅ | ✅ | — | High | ⬜ |Keep
| JWT session (httpOnly cookie or Bearer) | ✅ (Bearer) | ✅ (cookie) | — | High | ⬜ |keep
| Email OTP (passwordless) | ❌ | ❌ | ✅ | Medium | ⬜ |keep
| Phone OTP | ❌ | ❌ | ✅ | Low | ⬜ |PORT
| OIDC SSO (Google, Apple, Keycloak) | ❌ | ✅ | — | Low | ⬜ |Defer
| TOTP 2FA | ❌ | ✅ | — | Low | ⬜ |Defer
| Password reset (email token) | ❌ | ✅ | — | Medium | ⬜ |PORT
| Account deletion | ❌ | ✅ | — | Medium | ⬜ |PORT
| Session management (list/revoke) | ❌ | ✅ | — | Low | ⬜ |PORT
| User profile (username, bio, avatar, home city) | ✅ | ✅ | ✅ | High | ⬜ |
| Travel interest preferences | 🟡 (onboarding) | ❌ | ✅ | High | ⬜ |PORT
| Budget band preference (backpacker/mid/luxury) | ❌ | ❌ | ✅ | Medium | ⬜ |New

---

## B. Social Graph

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Follow / unfollow users | ✅ | ❌ | ✅ | High | ⬜ | KEEP
| Follower / following counts + lists | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| "Fellow Travelers" (people you may know) | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| User search | ✅ | ✅ | ✅ | High | ⬜ |KEEP
| Block / mute users | ❌ | ❌ | 🔧 | Low | ⬜ |Defer

---

## C. Feed & Discovery (Compass)

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Global public feed | ✅ | ❌ | ✅ | High | ⬜ | KEEP
| Personalized following feed | ✅ | ❌ | ✅ | High | ⬜ | KEEP
| AI-powered recommendation system | ❌ | ❌ | ✅ | Medium | ⬜ | Defer
| Stories / Trails bar at top of feed | ❌ | ❌ | ✅ | Medium | ⬜ | Defer
| Trending destinations | ✅ | ❌ | ✅ | High | ⬜ | KEEP
| Destination categories + filters | ✅ | ❌ | ✅ | High | ⬜ | KEEP
| Search (journals + users) | ✅ | ✅ | ✅ | High | ⬜ | KEEP

---

## D. Posts / Moments

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Create post with 3–5 photos | ✅ | ❌ | ✅ | High | ⬜ | KEEP
| Title + destination (start + end + pit stops) | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Date range | ✅ | — | ✅ | High | ⬜ |KEEP
| Activities field | ✅ | — | ✅ | High | ⬜ |
| Accommodation field | ✅ | — | ✅ | Medium | ⬜ |KEEP
| Budget field (₹ INR) | ✅ | — | ✅ | High | ⬜ |KEEP
| Hashtags | ❌ | ❌ | ✅ | Medium | ⬜ |KEEP
| Vacation type tag (workation/staycation/trek/road trip) | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| Mode of transportation | ❌ | — | ✅ | Medium | ⬜ |NEW
| Hotel info with price | ❌ | — | ✅ | Low | ⬜ |NEW
| Song / background music | ❌ | ❌ | ✅ | Low | ⬜ |Defer
| Edit post | ✅ | ✅ | ✅ | High | ⬜ |KEEP
| Delete post | ✅ | ✅ | ✅ | High | ⬜ |KEEP
| Rich text / story content | ✅ | — | ✅ | Medium | ⬜ |KEEP
| Day-by-day itinerary (JSON) | ✅ | — | ✅ | High | ⬜ |KEEP
| Photo carousel on detail | ✅ | — | ✅ | High | ⬜ |KEEP

---

## E. Reactions, Comments & Engagement

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| ❤️ Love reaction | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| 🔥 Epic reaction | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| 📍 Wanna Go reaction (→ bucket list) | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| 🌍 Wander reaction | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| 🤩 Amazing reaction | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| Reaction counts display | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Who reacted list | ✅ | ❌ | ✅ | Medium | ⬜ |KEEP
| Comments on posts | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Delete own comment | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Emoji reactions on chat messages | ❌ | ✅ | ✅ | Medium | ⬜ |DEFER

---

## F. Stories & Reels (Trails / Vlog)

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Short-form photo stories (Trails) | ❌ | ❌ | ✅ | Medium | ⬜ |
| Story viewer with progress bars | ❌ | ❌ | ✅ | Medium | ⬜ |
| Swipe navigation between stories | ❌ | ❌ | ✅ | Medium | ⬜ |
| Video reels (Vlog) | ❌ | ❌ | ✅ | Low | ⬜ |Defer
| Auto-caption (AI) | ❌ | ❌ | ✅ | Low | ⬜ |NEW
| Auto-hashtag (AI) | ❌ | ❌ | ✅ | Low | ⬜ |NEW
| Share / export story | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| "You seem to love X" suggestion after 3 posts | ❌ | ❌ | ✅ | Low | ⬜ |Defer (build later with AI recommnedation engine)

---

## G. Notifications

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| In-app notification feed | ✅ | ✅ | ✅ | High | ⬜ | KEEP
| Unread count badge | ✅ | ✅ | ✅ | High | ⬜ |KEEP
| Mark all as read | ✅ | ✅ | ✅ | High | ⬜ |KEEP
| Real-time push (WebSocket) | ❌ | ✅ | ✅ | High | ⬜ |PORT
| Interactive notifications (accept/decline) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Email notifications | ❌ | ✅ | 🔧 | Low | ⬜ |PORT
| Webhook notifications | ❌ | ✅ | ❌ | Low | ⬜ |PORT
| Per-type notification preferences | ❌ | ✅ | ✅ | Medium | ⬜ |PORT

---

## H. AI Trip Planner

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Claude AI itinerary generation | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Conversational UI (chat bubbles) | 🟡 (form) | ❌ | ✅ | High | ⬜ |NEW
| Day-by-day output with POIs | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Budget constraint input | 🟡 | ❌ | ✅ | High | ⬜ |NEW
| Activity preference input | ✅ | ❌ | ✅ | High | ⬜ |Keep
| Companion type input | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Date range input | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Live weather constraint | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Flights availability constraint | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| Hotels availability constraint | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| "Refine" follow-up conversation | ❌ | ❌ | ✅ | High | ⬜ |Defer
| "Shuffle Day" regenerate one day | ❌ | ❌ | ✅ | Medium | ⬜ | Defer
| "Optimize Budget" suggestion | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| Save AI plan to profile | ❌ | ❌ | ✅ | High | ⬜ |NEW
| Auth guard on AI endpoint | ❌ ⚠️ | ✅ | ✅ | **Critical** | ⬜ |PORT
| Suggest 3/5/9 day options | ❌ | ❌ | ✅ | Medium | ⬜ |NEW

---

## I. Trip Planner (Interactive)

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Multi-day trip structure | ✅ (journal JSON) | ✅ | ✅ | High | ⬜ |KEEP
| Drag-and-drop day reorder | ❌ | ✅ | ✅ | High | ⬜ |PORT
| Drag-and-drop place reorder | ❌ | ✅ | ✅ | High | ⬜ |PORT
| Cross-day assignment moves | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Interactive map with POI pins | ❌ | ✅ | ✅ | High | ⬜ |PORT
| Place search (Google + OSM) | ❌ | ✅ | ✅ | High | ⬜ |PORT
| Place details (hours, rating, photos) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Day notes (timestamped, icon-tagged) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Weather forecast per day | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Accommodation tracking (check-in/out) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Reservation tracking (flights, hotels) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| File attachments (tickets, PDFs) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Route optimization | ❌ | ✅ | ✅ | Low | ⬜ |PORT
| Export to calendar (ICS) | ❌ | ✅ | ✅ | Low | ⬜ |PORT
| PDF export | ❌ | ✅ | ❌ | Low | ⬜ |PORT
| Real-time multi-user collaboration | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Copy / duplicate trip | ❌ | ✅ | ✅ | Low | ⬜ |PORT
| Public share link | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Invite link for trip members | ❌ | ✅ | ✅ | Medium | ⬜ |PORT

---

## J. Travel Circles / Meetways

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Create group trip (circle/meetway) | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Public discovery with filters | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Join (public instant / private pending) | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Host approval flow | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Member list + roles | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Max people cap + spots counter | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Budget range | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Tags / vibe | ✅ | ❌ | ✅ | Medium | ⬜ |KEEP
| Cover photo + documents | ✅ | ❌ | ✅ | Medium | ⬜ |KEEP
| Group chat (realtime WebSocket) | 🟡 (polling) | ✅ | ✅ | High | ⬜ |PORT
| Decision polls | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Linked expense group | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| Linked trip itinerary | 🟡 (itinerary JSON) | ✅ | ✅ | Medium | ⬜ |PORT
| Status management (active/closed/completed) | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Edit meetway/circle | ✅ | — | ✅ | High | ⬜ |KEEP
| Delete meetway/circle | ✅ | — | ✅ | High | ⬜ |KEEP
| Leave circle | 🟡 (bug on web) | — | ✅ | High | ⬜ |NEW

---

## K. Expense Splitting (JustSplit / Expenses)

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Expense groups | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Add/remove members (app user or placeholder) | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Add expense (who paid, amount, category) | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Flexible split amounts | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Equal split mode | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Weighted split mode (percentages) | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| Rotating split mode (who pays next) | ❌ | ❌ | ✅ | Low | ⬜ |Drop
| Debt simplification / net balances | ✅ | ✅ | ✅ | High | ⬜ |
| Settlement recording | ✅ | ✅ | ✅ | High | ⬜ |PORT
| UPI intent deep links | ❌ | ❌ | ✅ | High (India) | ⬜ |DEFER
| PayTM / GPay deep links | ❌ | ❌ | ✅ | High (India) | ⬜ |DEFER
| Multi-currency | 🟡 (USD default) | ✅ | ✅ | Medium | ⬜ |PORT
| Join request + owner approval | ✅ | ❌ | ✅ | High | ⬜ |NEW
| SMS/receipt auto-parse (AI) | ❌ | ❌ | 🔧 | Low | ⬜ |Defer
| Expense categories | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Notes per expense | ✅ | ✅ | ✅ | High | ⬜ |PORT

---

## L. Per-Trip Budget Tracker

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Budget entries per journal/trip | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Category breakdown | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Pie chart visualization | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Total spent vs budget | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Per-person split | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Per-day breakdown | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Multi-currency | ❌ | ✅ | ✅ | Medium | ⬜ |PORT

---

## M. Packing Lists

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Packing lists per trip | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Packed / unpacked toggle | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Item categories | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Essential flag | ✅ | — | ✅ | Medium | ⬜ |PORT
| Quantity | ✅ | — | ✅ | Medium | ⬜ |KEEP
| Built-in templates | ✅ (4) | ✅ (admin-managed) | ✅ | High | ⬜ |PORT
| Save custom template | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Reorder items | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Member assignment per category | ❌ | ✅ | ✅ | Low | ⬜ |PORT
| Progress tracking (% packed) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Bag tracking (weight) | ❌ | ✅ | ❌ | Low | ⬜ |PORT

---

## N. Map & Geo Features

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Interactive map (Leaflet or Mapbox GL) | ❌ | ✅ | ✅ | High | ⬜ |PORT
| 3D buildings + terrain | ❌ | ✅ | 🔧 | Low | ⬜ |PORT
| POI pins on map | ❌ | ✅ | ✅ | High | ⬜ |PORT
| Photo markers on map | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Pin clustering | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Category filter on map | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Route visualization between POIs | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Route optimization | ❌ | ✅ | ✅ | Low | ⬜ |PORT
| Export route to Google Maps | ❌ | ✅ | ✅ | Low | ⬜ |PORT
| Offline map tile caching | ❌ | ✅ | ✅ | Low | ⬜ |PORT
| GPX import | ❌ | ✅ | ❌ | Low | ⬜ |PORT
| Naver Maps import | ❌ | ✅ | ❌ | Low | ⬜ |DROP
| Geocoding / reverse geocode | ❌ | ✅ | ✅ | Medium | ⬜ |PORT

---

## O. Flights & Hotels (TravelLens)

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Flight search (SerpAPI) | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Hotel search (SerpAPI) | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| Results in INR | ✅ | ❌ | ✅ | High | ⬜ |KEEP
| IATA code resolution | ✅ | ✅ (airports.ts) | ✅ | High | ⬜ |PORT
| "Book Pieces" link to TravelLens from Planner | ❌ | ❌ | ✅ | Medium | ⬜ |Defer

---

## P. Marketplace

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Curated trip listings (brands/influencers) | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| Date range filter | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| Budget filter | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| Theme filter (trek/festival/food) | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| Organizer type filter | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| Listing detail with map | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| Join / Book CTA | ❌ | ❌ | ✅ | Medium | ⬜ |Defer

---

## Q. Experiences & Events

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Event aggregation (BookMyShow/Ticketmaster) | ❌ | ❌ | ✅ | Low | ⬜ |Defer
| Event cards (date, location, price, tags) | ❌ | ❌ | ✅ | Low | ⬜ |Defer
| External booking link | ❌ | ❌ | ✅ | Low | ⬜ |Defer

---

## R. Workations

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Workation listings | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| Wi-Fi speed field | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| Desk photos | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| Cost + availability | ❌ | ❌ | ✅ | Medium | ⬜ |Defer
| Community vibe description | ❌ | ❌ | ✅ | Low | ⬜ |Defer

---

## S. Travel Graph & Gamification

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Countries visited map (Atlas) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| City / place count stats | ❌ | ✅ | ✅ | Medium | ⬜ |NEW
| Total spend stats | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| Travel companions graph | ❌ | ❌ | ✅ | Low | ⬜ |Defer
| Yearly recap | ❌ | ❌ | ✅ | Low | ⬜ |NEW
| Achievement badges | ❌ | ❌ | ✅ | Medium | ⬜ |NEW
| Friends leaderboard | ❌ | ❌ | ✅ | Low | ⬜ |NEW
| Community leaderboard | ❌ | ❌ | ✅ | Low | ⬜ |Defer
| Bucket list | ✅ | ✅ | ✅ | High | ⬜ |KEEP
| Travel streak tracking | ❌ | ✅ (Atlas) | 🔧 | Low | ⬜ |PORT

---

## T. Journal / Journey Magazine

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Magazine-style travel journal | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Rich content blocks (text/photos/map/quote) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Journey entry timeline | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Mood / day color coding | ❌ | ✅ | — | Low | ⬜ |Defer
| Co-authors / contributors | ❌ | ✅ | — | Low | ⬜ |Drop
| Public share link for journey | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| PDF export of journey | ❌ | ✅ | ❌ | Low | ⬜ |PORT

---

## U. Photo Management

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Photo upload to posts | ✅ (Cloudinary) | ✅ (local) | ✅ | High | ⬜ |PORT
| Trip photo gallery | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Day/place photo linking | ❌ | ✅ | ✅ | Medium | ⬜ |
| Caption per photo | ❌ | ✅ | ✅ | Low | ⬜ |PORT
| Immich integration | ❌ | ✅ | ❌ | Low | ⬜ |PORT
| Synology Photos integration | ❌ | ✅ | ❌ | Low | ⬜ |PORT
| AI auto-caption (from photo) | ❌ | ❌ | ✅ | Low | ⬜ |NEW
| POV shot suggestions (composition) | ❌ | ❌ | ✅ | Low | ⬜ |Drop

---

## V. Vacation Planner (Vacay addon — TREK only)

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Team vacation calendar | ❌ | ✅ | ❌ | Low | ⬜ |Drop
| Holiday calendars (100+ countries) | ❌ | ✅ | ❌ | Low | ⬜ |Drop
| Vacation day quotas | ❌ | ✅ | ❌ | Low | ⬜ |Drop
| Carry-over tracking | ❌ | ✅ | ❌ | Low | ⬜ |Drop
| Company holidays | ❌ | ✅ | ❌ | Low | ⬜ |Drop

---

## W. Infrastructure & DevOps

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| Docker deployment | ❌ | ✅ | 🔧 | Medium | ⬜ |PORT
| Health check endpoint | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Environment variable config | ✅ | ✅ | ✅ | High | ⬜ |PORT
| Automated backups | ❌ | ✅ | — | Low | ⬜ |PORT
| Audit log | ❌ | ✅ | — | Low | ⬜ |PORT
| PWA (offline + installable) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| Service Worker (Workbox) | ❌ | ✅ | ✅ | Medium | ⬜ |PORT
| i18n / localization | ❌ | ✅ (15 lang) | ✅ | Medium | ⬜ |PORT
| Analytics integration (PostHog/GA4) | ❌ | ❌ | ✅ | Low | ⬜ |DROP
| Feature flags | ❌ | ❌ | 🔧 | Low | ⬜ |DROP
| Error boundaries | ❌ | — | ✅ | Medium | ⬜ |DROP
| Rate limiting | ❌ | ✅ (MCP) | — | Medium | ⬜ |PORT
| Admin panel | ❌ | ✅ | 🔧 | Low | ⬜ |PORT
| Tests (Vitest / Playwright) | ❌ | ✅ | ✅ | Low | ⬜ |PORT

---

## X. MCP / AI Integration (TREK only feature)

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| MCP server (AI tools API) | ❌ | ✅ (150+ tools) | ❌ | Low | ⬜ |PORT
| OAuth 2.1 for MCP | ❌ | ✅ | ❌ | Low | ⬜ |PORT
| AI automation of trip management | ❌ | ✅ | — | Low | ⬜ |PORT

---

## Y. Payments

| Feature | V1 | TREK | PRD | Priority | Decision |
|---------|:--:|:----:|:---:|----------|----------|
| UPI intent links (GPay/PhonePe/BHIM) | ❌ | ❌ | ✅ | High (India) | ⬜ |Defer
| PayTM deep link | ❌ | ❌ | ✅ | High (India) | ⬜ |Defer
| Razorpay checkout (web) | ❌ | ❌ | 🔧 | Medium | ⬜ |
| Stripe checkout (web, international) | ❌ | ❌ | 🔧 | Low | ⬜ |Defer
| Saved payment methods | ❌ | ❌ | ✅ | Low | ⬜ |Defer

---

## How to Use This Matrix

1. Go through each row and mark your `Decision` column with one of:
   - **Keep** — use existing V1 code, possibly with fixes
   - **Port** — adapt the TREK implementation for Roamera
   - **New** — build fresh from PRD spec
   - **Drop** — not in scope for next build
   - **Defer** — do later, after MVP

2. Once decisions are filled in, we can group into sprints / milestones.

3. Features marked **Critical** (e.g., AI endpoint auth) should be fixed before building new features on top of them.
