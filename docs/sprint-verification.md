# Sprint Verification Framework

> Run this checklist after every sprint to confirm the demo works end-to-end.
> Update the "Sprint-specific checks" section for each new sprint.

---

## Pre-flight Checks (run after every sprint)

```bash
# 1. Install dependencies
pnpm install

# 2. TypeScript — must pass with zero errors
pnpm typecheck

# 3. Apply migrations on fresh DB (or existing dev DB)
pnpm --filter api db:migrate

# 4. Seed demo data
pnpm --filter api db:seed

# 5. Start API — must return { status: "ok" }
pnpm --filter api dev &
sleep 5 && curl -s http://localhost:3000/api/health | jq .

# 6. Start Web — must load without console errors
pnpm --filter web dev &
sleep 5 && curl -s http://localhost:3001 | head -5

# 7. (Sprint 3+) Start AI service
cd apps/ai-service && python -m uvicorn src.main:app --reload &
sleep 5 && curl -s http://localhost:8000/v1/health | jq .
```

---

## API Smoke Tests

### Sprint 1 — Auth & Profiles

```bash
BASE=http://localhost:3000/api/v1

# Register
curl -s -X POST $BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"Password123!","displayName":"Test User"}' | jq .

# Login
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Password123!"}' | jq -r .accessToken)
echo "Token: $TOKEN"

# Get current user
curl -s $BASE/users/me -H "Authorization: Bearer $TOKEN" | jq .user.username

# Update profile
curl -s -X PATCH $BASE/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bio":"Travel lover!"}' | jq .user.bio

# Follow a user (use a seeded user id)
curl -s -X POST $BASE/users/<user-id>/follow -H "Authorization: Bearer $TOKEN" | jq .

# Search users
curl -s "$BASE/users/search?q=arya" -H "Authorization: Bearer $TOKEN" | jq .users[].username

# Public profile (no auth)
curl -s $BASE/users/arya_explorer | jq .user.username
```

### Sprint 2 — Moments & Social Feed

```bash
# Create post
POST_ID=$(curl -s -X POST $BASE/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My trip","content":"Amazing experience!","destinations":[{"name":"Goa"}],"activities":[],"hashtags":["goa","india"]}' | jq -r .post.id)
echo "Post: $POST_ID"

# React to post
curl -s -X POST $BASE/posts/$POST_ID/reactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"love"}' | jq .

# Comment on post
curl -s -X POST $BASE/posts/$POST_ID/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"What a beautiful place!"}' | jq .

# Get compass feed
curl -s "$BASE/feed/compass?feed=global&limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.posts | length'

# Search
curl -s "$BASE/feed/search?q=goa" \
  -H "Authorization: Bearer $TOKEN" | jq '.posts | length'

# Save post
curl -s -X POST $BASE/posts/$POST_ID/save \
  -H "Authorization: Bearer $TOKEN" | jq .

# Get saved posts
curl -s $BASE/feed/saved \
  -H "Authorization: Bearer $TOKEN" | jq '.posts | length'

# Wanna go bucket list
curl -s "$BASE/feed/bucket-list" \
  -H "Authorization: Bearer $TOKEN" | jq '.items | length'

# Trending
curl -s $BASE/feed/trending \
  -H "Authorization: Bearer $TOKEN" | jq '{destinations: .destinations | length, hashtags: .hashtags | length}'

# User posts API
curl -s "$BASE/users/$USER_ID/posts" \
  -H "Authorization: Bearer $TOKEN" | jq '.posts | length'
```

### Sprint 3 — AI Planner & TravelLens

```bash
# AI Plan (requires AI service running)
curl -s -X POST $BASE/ai/plan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"destination":"Goa","nights":3,"budgetBand":"moderate","preferences":["beach","seafood"]}' | jq .itinerary.destination

# AI Hashtags
curl -s -X POST $BASE/ai/hashtags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"postContent":"Visited Goa beaches, beautiful sunset!","destination":"Goa"}' | jq .hashtags

# Travel Airports (no Amadeus key needed — returns mock)
curl -s "$BASE/travel/airports?q=DEL" \
  -H "Authorization: Bearer $TOKEN" | jq '.airports[0].iataCode'

# Travel Flights (returns deep-links even without Amadeus key)
curl -s "$BASE/travel/flights?origin=DEL&destination=BOM&departureDate=2026-06-01" \
  -H "Authorization: Bearer $TOKEN" | jq .deepLinks.googleFlights

# Travel Hotels
curl -s "$BASE/travel/hotels?city=Goa" \
  -H "Authorization: Bearer $TOKEN" | jq .deepLinks.booking
```

---

## Demo Script Template

Each sprint should have a walkthrough script in its plan file. Template:

```
### Scene 1: [Action]
- User: [which demo user]
- Navigate to: [URL or screen]
- Action: [what to do]
- Expected: [what you should see]
- Screenshot/record: [yes/no]
```

---

## Sprint 3 — Demo Walkthrough

**Pre-requisites:**
1. Both API (port 3000) and Web (port 3001) running
2. AI service running on port 8000 (optional — degrades gracefully)
3. DB seeded with demo data

### Scene 1: Login
- Login at `http://localhost:3001/login` as `arya@demo.roamera.in` / `password123`
- Expected: Redirect to Compass feed with posts

### Scene 2: Compass Feed + Trending
- Navigate to `/home`
- Expected: Feed cards visible, trending sidebar on right with destinations + hashtags
- Click a trending destination → goes to `/destinations/[id]`

### Scene 3: Search
- Click the search icon (🔍) in navbar
- Type "Goa"
- Expected: Shows destinations, posts, and users matching "Goa"

### Scene 4: Destination Detail
- Click any destination card
- Expected: Hero image, description, grid of recent Moments from that destination

### Scene 5: AI Planner
- Navigate to `/ai-planner`
- Type: "Plan 5 days in Rajasthan with ₹25,000 budget"
- Expected: AI generates day-by-day itinerary (may take 5-15s)
- Type: "Make it cheaper"
- Expected: Itinerary refines to budget options
- Click "Optimize Budget" → itinerary updates
- Click "Export" → downloads JSON file

### Scene 6: TravelLens — Flights
- Navigate to `/travel`
- Select origin: DEL (Delhi), destination: BOM (Mumbai)
- Pick any future date
- Click "Search Flights"
- Expected: Either flight results OR deep-link buttons (if Amadeus not configured)
- Click "Google Flights" → opens Google Flights in new tab

### Scene 7: TravelLens — Hotels
- Switch to Hotels tab
- Type "Goa" as destination city
- Click "Search Hotels"
- Expected: Hotel cards or deep-link buttons with Booking.com, MakeMyTrip links

### Scene 8: Profile Posts
- Navigate to `/u/arya_explorer`
- Expected: Posts tab shows actual posts (not stub)
- Infinite scroll works for large lists

---

## Working Demo Guarantee

Every sprint **must** deliver:
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm --filter api db:seed` completes without errors
- [ ] All new API endpoints return HTTP 200 with expected shape
- [ ] Web app loads and navigates to all new pages without crashes
- [ ] All seeded demo data is visible in the UI

---

## Demo Credentials

All passwords: `password123`

| Username | Email |
|----------|-------|
| arya_explorer | arya@demo.roamera.in |
| marco_travels | marco@demo.roamera.in |
| leo_backpacker | leo@demo.roamera.in |
| ana_nomad | ana@demo.roamera.in |
| kenji_wanders | kenji@demo.roamera.in |
