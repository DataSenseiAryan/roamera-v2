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

## API Smoke Tests

### Sprint 4 — Trip Planner, Maps & Weather

```bash
BASE=http://localhost:3000
TOKEN=$(curl -s -X POST $BASE/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"arya@demo.roamera.in","password":"password123"}' | jq -r .accessToken)

# List trips (should show Rajasthan Heritage Tour)
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/v1/trips | jq '.trips[] | {title, myRole}'

# Get trip detail (use a trip ID from the list)
TRIP_ID=$(curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/v1/trips | jq -r '.trips[0].id')
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/v1/trips/$TRIP_ID | jq '{title: .trip.title, dayCount, memberCount}'

# Get days
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/v1/trips/$TRIP_ID/days | jq '.days[] | {dayNumber, title}'

# Get places
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/v1/trips/$TRIP_ID/places | jq '.places[] | {name, lat, lng}'

# Get assignments
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/v1/trips/$TRIP_ID/assignments | jq '.assignments | length'

# Create a new trip
curl -s -X POST $BASE/api/v1/trips \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test S4 Trip","currency":"INR"}' | jq '{id: .trip.id, title: .trip.title}'

# Maps autocomplete
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/maps/autocomplete?q=Jaipur" | jq '.results | length'

# Weather forecast (note: may fail locally due to SSL; works in prod)
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/api/v1/weather/forecast?lat=26.9&lng=75.8&days=5" | jq '.forecast | length'

# Trip members
curl -s -H "Authorization: Bearer $TOKEN" $BASE/api/v1/trips/$TRIP_ID/members | jq '.members[] | {username, role}'

# Generate share link
SHARE=$(curl -s -X POST $BASE/api/v1/trips/$TRIP_ID/share \
  -H "Authorization: Bearer $TOKEN" | jq -r .shareToken)
echo "Share token: $SHARE"
curl -s $BASE/api/v1/trips/shared/$SHARE | jq '{title: .trip.title, dayCount: (.days | length)}'
```

### Sprint 4 — Demo Walkthrough Scenes

#### Scene 1: Create a new trip
- Navigate to `/trips`
- Click "New Trip"
- Fill in title "Manali Snow Trip", dates, INR currency
- Click "Create Trip" → redirects to trip detail page
- Verify: empty day list, leaflet map visible

#### Scene 2: Add days and places
- On trip detail page, click "+ Add Day" twice
- On Day 1, click "+" → Add Place panel opens
- Search "Solang Valley" → select from Nominatim results
- Click "Add Place" → place appears on day + map marker shows

#### Scene 3: Drag-drop reorder
- Add 2+ places to Day 1
- Drag the second place above the first
- Expected: order persists (API call made)

#### Scene 4: Weather forecast
- Add a place with known coordinates (e.g. Delhi: 28.6, 77.2)
- Expected: weather widget shows in day header with temp + icon

#### Scene 5: Real-time collaboration (multi-tab test)
- Open trip in two browser tabs
- Add a place in Tab 1
- Expected: place appears in Tab 2 without refresh (WebSocket)
- Note: requires browser tab on port 3001, API on 3000, and valid ws_token

#### Scene 6: Share public link
- Click "Share" in trip header
- Copy the share link
- Open in incognito/new window
- Expected: read-only trip view with all days and places, no login required

#### Scene 7: Members management
- Click "Members" button
- Invite `marco_travels` as Editor
- Expected: member appears in list with editor badge
- Try as marco_travels: should be able to add places

#### Scene 8: ICS export
- Click "ICS" download button
- Expected: `.ics` calendar file downloads
- Open in Google Calendar or Apple Calendar → events visible

---

## Working Demo Guarantee

Every sprint **must** deliver:
- [ ] `pnpm typecheck` passes with zero errors
- [ ] `pnpm --filter api db:migrate` completes without errors
- [ ] `pnpm --filter api db:seed` completes without errors
- [ ] All new API endpoints return HTTP 200 with expected shape
- [ ] Web app loads and navigates to all new pages without crashes
- [ ] All seeded demo data is visible in the UI

### Sprint 4 Acceptance Criteria
- [x] Create trip → add 3 days → add 5 places → drag-drop to reorder → see on map
- [x] Trip members: invite a member, change role, remove
- [x] Trip share: generate public link → view read-only trip without login
- [x] ICS export: download calendar file with trip events
- [x] Maps API: Nominatim autocomplete returns results
- [x] Weather API: Open-Meteo forecast returns 7-day data (may fail locally due to SSL)
- [x] WebSocket: authenticated connection via ws_token, room subscriptions work
- [ ] Real-time collab: two tabs open same trip → add in tab 1 appears in tab 2 (requires browser test)

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
