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
sleep 5 && curl -s http://localhost:8000/health | jq .
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
curl -s $BASE/auth/me -H "Authorization: Bearer $TOKEN" | jq .user.username

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
- [x] `pnpm typecheck` passes with zero errors
- [x] `pnpm --filter api db:migrate` completes without errors
- [x] `pnpm --filter api db:seed` completes without errors
- [x] All new API endpoints return HTTP 200 with expected shape
- [x] Web app loads and navigates to all new pages without crashes
- [x] All seeded demo data is visible in the UI

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

## Sprint 5 — Budget & Packing

### API Smoke Tests

```bash
BASE=http://localhost:3000/api/v1
TOKEN=<your-jwt-token>

# --- Budget ---

# Get budget summary (empty initially)
curl -s $BASE/trips/<tripId>/budget -H "Authorization: Bearer $TOKEN" | jq .grandTotal

# Add budget item
curl -s -X POST $BASE/trips/<tripId>/budget/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category":"Food","name":"Dinner at cafe","totalPrice":"1500","currency":"INR","persons":2,"days":1}' | jq .item

# Set splits for an item
curl -s -X POST $BASE/trips/<tripId>/budget/items/<itemId>/splits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"splits":[{"userId":"<user1>","amount":"750"},{"userId":"<user2>","amount":"750"}]}' | jq .

# Toggle paid
curl -s -X PATCH $BASE/trips/<tripId>/budget/items/<itemId>/splits/<userId> \
  -H "Authorization: Bearer $TOKEN" | jq .

# Record settlement
curl -s -X POST $BASE/trips/<tripId>/budget/settle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fromUserId":"<user1>","toUserId":"<user2>","amount":"750","currency":"INR"}' | jq .

# List settlements
curl -s $BASE/trips/<tripId>/budget/settlements -H "Authorization: Bearer $TOKEN" | jq .settlements

# --- Packing ---

# Get packing list (auto-creates if none)
curl -s $BASE/trips/<tripId>/packing -H "Authorization: Bearer $TOKEN" | jq .progress

# Add category
curl -s -X POST $BASE/trips/<tripId>/packing/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Clothing"}' | jq .category

# Add packing item
curl -s -X POST $BASE/trips/<tripId>/packing/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sunscreen","quantity":1}' | jq .item

# Check item (toggle packed)
curl -s -X PATCH $BASE/trips/<tripId>/packing/items/<itemId> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isPacked":true}' | jq .item.isPacked

# Create bag
curl -s -X POST $BASE/trips/<tripId>/packing/bags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Cabin Bag","color":"#3B82F6"}' | jq .bag

# Browse packing templates
curl -s $BASE/packing-templates -H "Authorization: Bearer $TOKEN" | jq '.templates[].name'

# Apply template
curl -s -X POST $BASE/trips/<tripId>/packing/templates/apply \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"templateId":"<templateId>"}' | jq .
```

### Demo Walkthrough (S5)

#### Scene 1: Budget tab — Add expenses
- Login as arya_explorer
- Open "Rajasthan Heritage Tour" trip → click **Budget** tab
- Expected: Seeded budget items visible, grouped by category (Transport, Accommodation, Food, etc.)
- Grand total card shows total in INR

#### Scene 2: Budget splits & settlements
- Expand a budget item → see member splits
- Toggle "paid" for a member
- Click "Record Settlement" → enter payment details
- Expected: Balance summary updates, simplified debts recalculated

#### Scene 3: Add new expense
- Click "Add Expense" button
- Fill form: category=Activities, name="Camel Safari", price=2000, INR, 2 persons, 1 day
- Expected: Item appears in Activities category, total updates

#### Scene 4: Packing tab — Checklist
- Switch to **Packing** tab
- Expected: Progress bar shows X of Y packed
- Categories listed: Clothing, Toiletries, Documents
- Some items already checked (from seed)

#### Scene 5: Pack items
- Check unchecked items → progress bar updates
- Add new item: "Power bank" in category "Electronics"
- Expected: Item appears, progress denominator increases

#### Scene 6: Bags
- View bags section (Cabin Bag visible from seed)
- Create new bag: "Check-in Luggage"
- Assign items to bags
- Expected: Bag shows item count

#### Scene 7: Apply template
- Click "Apply Template" → select "Beach Vacation"
- Expected: Template categories and items merge into current packing list

#### Scene 8: Real-time collaboration
- Open same trip in two browser tabs
- In tab 1: check a packing item
- Expected: Tab 2 shows the item checked (via WebSocket broadcast)

### Sprint 5 Acceptance Criteria
- [x] Add 10 budget items across 3 categories → totals correct, multi-currency converted
- [x] Assign split amounts per person → per-person balance calculated correctly
- [x] Record a settlement → balance updates and shows settled
- [x] Apply packing template → items appear in correct categories
- [x] Check an item → real-time update in other browser tab (WS)

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

---

## Sprint 6 — Travel Circles & Trip Collab

### API Smoke Tests

```bash
BASE=http://localhost:3000/api/v1
TOKEN=<your-jwt-token>

# --- Circles ---

# List circles (should show 2 seeded circles)
curl -s $BASE/circles -H "Authorization: Bearer $TOKEN" | jq '.circles[].title'

# Get circle detail with members
curl -s $BASE/circles/<circleId> -H "Authorization: Bearer $TOKEN" | jq '{title: .circle.title, members: [.members[].username]}'

# Get circle messages
curl -s $BASE/circles/<circleId>/messages -H "Authorization: Bearer $TOKEN" | jq '.messages | length'

# Send a message
curl -s -X POST $BASE/circles/<circleId>/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello from the test!"}' | jq .message.id

# React to a message
curl -s -X POST $BASE/circles/<circleId>/messages/<messageId>/react \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"emoji":"👍"}' | jq .

# Get polls
curl -s $BASE/circles/<circleId>/polls -H "Authorization: Bearer $TOKEN" | jq '.polls | length'

# Create a poll
curl -s -X POST $BASE/circles/<circleId>/polls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question":"Best activity?","options":["Hiking","Swimming","Sightseeing"],"isMultiple":false}' | jq .poll.id

# Vote on a poll
curl -s -X POST $BASE/circles/<circleId>/polls/<pollId>/vote \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"optionIndex":0}' | jq .

# Join a circle
curl -s -X POST $BASE/circles/<circleId>/join \
  -H "Authorization: Bearer $TOKEN" | jq .

# --- Trip Collab ---

# Get trip collab messages
curl -s $BASE/trips/<tripId>/collab/messages -H "Authorization: Bearer $TOKEN" | jq '.messages | length'

# Send a collab message
curl -s -X POST $BASE/trips/<tripId>/collab/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"Meeting at hotel lobby at 9am!"}' | jq .message.content

# Get notes (should show 2 seeded notes)
curl -s $BASE/trips/<tripId>/collab/notes -H "Authorization: Bearer $TOKEN" | jq '[.notes[] | {title, isPinned}]'

# Create a note
curl -s -X POST $BASE/trips/<tripId>/collab/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Day 2 plans","content":"Visit palace in morning","color":"#dbeafe"}' | jq .note.id

# Get collab polls
curl -s $BASE/trips/<tripId>/collab/polls -H "Authorization: Bearer $TOKEN" | jq '.polls | length'
```

### Demo Walkthrough (S6)

#### Scene 1: Circles list
- Login as arya_explorer → click "Circles" in navbar
- Expected: "Rajasthan Road Trip Squad" (owner) and "Goa Beach Gang" (member) visible
- Each card shows member count, destination, public badge

#### Scene 2: Circle chat
- Open "Rajasthan Road Trip Squad"
- Expected: 5 seeded messages visible in chat with authors
- First message has 👍 reaction from marco

#### Scene 3: Send message + real-time
- Type and send a new message
- Expected: Message appears instantly in chat
- Open circle in another tab — should also show the new message

#### Scene 4: Create and vote on poll
- Create circle: "Best hotel for Day 2?" with 3 options
- Vote on option 1
- Expected: Vote bar updates to show result

#### Scene 5: Circle members
- Switch to Members panel
- Expected: 3 members listed (arya as owner, marco and leo as members)
- Invite "ana_nomad" → member count increases to 4

#### Scene 6: Trip Collab tab
- Open "Rajasthan Heritage Tour" → click **Collab** tab
- Expected: Chat sub-tab shows 3 seeded messages
- Switch to **Notes** tab: 2 notes visible, "Important reminders" is pinned

#### Scene 7: Create collab note
- Click "Add Note" → fill title "Day 3 Reminders", content, pick yellow color
- Expected: Note card appears in the notes grid

#### Scene 8: Trip collab poll
- Switch to **Polls** tab in Collab
- Expected: 1 seeded poll "Which optional activity..." with votes visible

### Sprint 6 Acceptance Criteria

- [x] Create circle → invite 2 members → exchange messages in real-time
- [x] Create poll → vote → results update
- [x] Link circle to a trip → trip title shows in circle sidebar
- [x] Trip Collab tab: send messages, create notes, create polls
- [x] Seeded data visible: 2 circles, messages, polls, trip collab notes
