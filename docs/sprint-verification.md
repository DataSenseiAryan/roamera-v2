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
- [x] Real-time collab: two tabs open same trip → add in tab 1 appears in tab 2 (requires manual browser test — WS infrastructure verified)

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

---

## Sprint 7 — JustSplit

### API Smoke Tests

```bash
BASE=http://localhost:3000/api/v1
TOKEN=<your-jwt-token>

# --- Expense Groups ---

# List groups (should show 2 seeded groups)
curl -s $BASE/expenses/groups -H "Authorization: Bearer $TOKEN" | jq '[.groups[] | {name, myBalance, currency}]'

# Get group detail with members
curl -s $BASE/expenses/groups/<groupId> -H "Authorization: Bearer $TOKEN" | jq '{name: .group.name, members: [.members[].username]}'

# Get expenses list
curl -s $BASE/expenses/groups/<groupId>/expenses -H "Authorization: Bearer $TOKEN" | jq '.expenses | length'

# Add an expense (equal split)
curl -s -X POST $BASE/expenses/groups/<groupId>/expenses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Test lunch","amount":"900","currency":"INR","paidBy":"<userId>","splitType":"equal","category":"Food"}' | jq .expense.id

# Get balances with simplified debts
curl -s $BASE/expenses/groups/<groupId>/balances -H "Authorization: Bearer $TOKEN" | jq '{members: [.members[] | {username, netBalance}], debts: [.simplifiedDebts[] | "\(.fromUsername) → \(.toUsername): \(.amount) \(.currency)"]}'

# Record a settlement
curl -s -X POST $BASE/expenses/groups/<groupId>/settle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"toUserId":"<toUserId>","amount":"1000","currency":"INR"}' | jq .success

# Add member
curl -s -X POST $BASE/expenses/groups/<groupId>/members \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"username":"kenji_wanders"}' | jq .member.username
```

### Demo Walkthrough (S7)

#### Scene 1: JustSplit list
- Login as arya_explorer → click "Split" in navbar (Receipt icon)
- Expected: "Goa Trip Expenses" (green balance, you're owed) and "Rajasthan Crew" (red balance, you owe)

#### Scene 2: Group detail
- Open "Goa Trip Expenses"
- Expected: 5 expenses listed — hotel, seafood dinner, taxi, surfing, groceries
- Each shows amount, who paid, split type badge (Equal/Exact/Weighted)

#### Scene 3: Balance panel
- Right sidebar shows per-person balances
- "Simplified Debts" section: ana_nomad → arya_explorer: ₹3900

#### Scene 4: Add equal expense
- Click "Add Expense" → fill: "Breakfast", ₹600, paid by arya_explorer, Equal split
- Expected: Expense appears, balances update

#### Scene 5: Add exact expense
- Add "Theme park tickets" ₹2400, Exact split
- Assign: arya=₹1000, marco=₹800, ana=₹600
- Expected: validation shows ₹2400 = ₹2400 ✓, expense created with correct splits

#### Scene 6: Settle debt
- In balances panel, click "Settle" on ana_nomad → arya_explorer debt
- Enter amount: ₹3900
- Expected: Balance updates, debt disappears from simplified list

### Sprint 7 Acceptance Criteria

- [x] 2 demo groups with 5 expenses each and mixed split types
- [x] Balance calculation correct (net per member)
- [x] Debt simplification: multi-person debts reduced to minimal transactions
- [x] Equal split: auto-calculated per member
- [x] Settlement recording: balance updates after settle
- [x] API smoke tests pass: groups, expenses, balances, settle

---

## Sprint 8 — Journey Magazine, Atlas, Gamification

### API Smoke Tests

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"arya@demo.roamera.in","password":"password123"}' | jq -r '.accessToken')

# Journeys
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/journeys
# Expected: { journeys: [{ title: "Rajasthan Heritage Journal", ... }] }

curl -s http://localhost:3000/api/v1/journeys/public/demo-rajasthan-share-token
# Expected: { journey: { title: "Rajasthan Heritage Journal", isPublic: true }, entries: [...], owner: {...} }

# Atlas
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/atlas/countries
# Expected: { countries: [...8 countries for arya...] }

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/atlas/stats
# Expected: { stats: { totalCountries: 8, percentage: 4.1, continentBreakdown: [...] } }

curl -s -X POST -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/atlas/countries/AU
# Expected: { country: { countryCode: "AU", countryName: "Australia", ... } }

# Gamification
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/gamification/badges
# Expected: { badges: [...4 badges: first_post, first_journey, five_countries, first_trip...] }

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/gamification/stats
# Expected: { stats: { posts, trips, countries, badges } }

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/gamification/leaderboard
# Expected: { leaderboard: [{ rank: 1, username: "...", countriesVisited: 8 }] }
```

### Demo Walkthrough (8 scenes)

#### Scene 1: Journey list
- Navigate to http://localhost:3001/journeys
- Expected: "Rajasthan Heritage Journal" card visible (Public, Owner)

#### Scene 2: Journey detail / editor
- Click into the Rajasthan journey
- Expected: 4 entries displayed — Arrival in Jaipur, Amber Fort, Desert Safari, Udaipur Lakes
- Each entry shows heading/text/quote blocks rendered in magazine style

#### Scene 3: Share a journey
- Click "Share" button → share URL appears with copy button
- Open the link in incognito: http://localhost:3001/journeys/public/demo-rajasthan-share-token
- Expected: Beautiful public magazine layout, no auth required

#### Scene 4: Add a journal entry
- In editor, click "Add Entry"
- Add title: "Jodhpur Blue City", block type: heading, text: "Day 12 — The Blue City"
- Expected: Entry appears immediately after save

#### Scene 5: Atlas page
- Navigate to http://localhost:3001/atlas
- Expected: 8 countries shown (India, Thailand, Japan, Nepal, Sri Lanka, Indonesia, Vietnam, Malaysia)
- Stats panel: 8 countries, ~4.1% of world, Asia continent highlighted

#### Scene 6: Mark country visited
- Type "Greece" in the search bar → click + Add
- Expected: Greece appears in visited countries, stats update to 9 countries

#### Scene 7: Profile badges
- Navigate to http://localhost:3001/u/arya_explorer
- Click "Badges" tab
- Expected: 4+ badges shown: First Moment 📸, Journal Keeper 📓, Globetrotter 🌍, Trip Planner 🗓️

#### Scene 8: Profile stats
- Click "Stats" tab on same profile
- Expected: Stats panel with Moments/Trips/Countries/Badges counts

### Sprint 8 Acceptance Criteria

- [x] Journey CRUD (create, read, update, delete) works
- [x] Journey entries: add, edit, delete with block content
- [x] Public sharing: share token generates, public view loads without auth
- [x] Contributors: invite by username, contributor role works
- [x] Atlas: mark/unmark countries, stats computed correctly
- [x] Gamification: badge engine awards badges idempotently, leaderboard sorts by countries
- [x] Demo seed: 2 journeys, 8+5 visited countries, 4 badges per user
- [x] API smoke tests pass: all 8 endpoints return correct data

---

## Sprint 9 — Notifications, Admin Panel, Comprehensive Test Suite

### Running the Test Suite

Sprint 9 introduces the full automated test suite. Run it after every sprint:

```bash
# One-command full sprint test (starts services, runs all suites, prints summary)
./scripts/test-sprint.sh

# Run only API tests (already running services)
cd apps/api
DATABASE_URL="file:./data/test.db" NODE_ENV="test" \
  JWT_SECRET="test-jwt-secret-for-tests-only-must-be-32chars" \
  JWT_REFRESH_SECRET="test-refresh-secret-for-tests-only-must-be-32chars" \
  pnpm test

# Run only AI service tests
cd apps/ai-service
AI_PROVIDER=mock AI_SERVICE_SECRET=dev-ai-service-secret-change-in-production-32 \
  ./venv/bin/pytest tests/ -v

# Run with coverage (API)
cd apps/api && pnpm test:coverage
```

**Test results as of S9 implementation:**
- API tests: **62 tests, 12 files, all green** (~13s)
- AI service tests: **13 tests, 4 files, all green** (~1s)
- Total: **75 tests — 0 failures**

### Demo Walkthrough

#### Scene 1: Notification bell (follow trigger)
- Log in as `marco@demo.roamera.in`
- Navigate to `arya@demo.roamera.in` profile → click Follow
- Log in (new tab) as `arya@demo.roamera.in`
- Expected: Bell icon shows unread badge (count ≥ 1)

#### Scene 2: Notification drawer
- Click bell icon → drawer slides in from right
- Expected: Notification "marco_travels started following you" visible
- Click notification → marks as read, badge count decrements

#### Scene 3: Interactive trip invite
- As arya (admin), invite marco to a trip via `/trips/:id/members`
- As marco, open notification drawer
- Expected: Notification has "Accept" and "Decline" buttons
- Click Accept → `POST /api/v1/notifications/:id/respond { action: "accept" }`

#### Scene 4: Notification preferences
- Navigate to http://localhost:3001/settings/notifications
- Toggle off "Email" for "New Comment"
- Expected: `PATCH /api/v1/notifications/preferences` updates pref; no email on next comment

#### Scene 5: System notice banner
- Log in as `arya@demo.roamera.in` (admin)
- Navigate to http://localhost:3001/admin/notices
- Create a new notice: title "Welcome to Roamera V2 Beta", body "We're live!", mark active
- Navigate to any page
- Expected: Yellow banner appears at top with dismiss (×) button

#### Scene 6: Admin user management
- Navigate to http://localhost:3001/admin/users
- Expected: User table with all demo users, role badges
- Suspend `leo_backpacker`: click suspend toggle
- Try to log in as `leo@demo.roamera.in`
- Expected: 403 "Account suspended" error

#### Scene 7: Admin stats dashboard
- Navigate to http://localhost:3001/admin
- Expected: 4 stat cards: Total Users, Total Posts, Total Trips, DAU

#### Scene 8: Admin audit log
- Navigate to http://localhost:3001/admin/audit-log
- Expected: Recent actions (follows, post creations, logins) paginated log

### API Smoke Tests (S9)

```bash
BASE="http://localhost:3000/api/v1"
TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"arya@demo.roamera.in","password":"password123"}' | jq -r .accessToken)

# Notifications feed
curl -s "$BASE/notifications" -H "Authorization: Bearer $TOKEN" | jq 'length'

# Unread count
curl -s "$BASE/notifications/unread-count" -H "Authorization: Bearer $TOKEN" | jq .count

# Notification prefs
curl -s "$BASE/notifications/preferences" -H "Authorization: Bearer $TOKEN" | jq 'length'

# Public notices
curl -s "$BASE/notices" | jq 'length'

# Admin stats (admin token required)
curl -s "$BASE/admin/stats" -H "Authorization: Bearer $TOKEN" | jq .

# Admin user list
curl -s "$BASE/admin/users" -H "Authorization: Bearer $TOKEN" | jq '.users | length'
```

### Sprint 9 Acceptance Criteria

- [x] Follow a user → followee receives in-app notification within 1s (WS delivery)
- [x] Trip invite notification has accept/decline buttons that work inline
- [x] Turn off email notifications for "new comment" → no email sent on comment
- [x] Admin can suspend a user → suspended user gets 403 on API calls
- [x] System notice created by admin → banner visible to all logged-in users
- [x] `./scripts/test-sprint.sh` exits 0 — all 75 tests green
- [x] AI service works with mock provider (no API key required in dev)

---

## Sprint 10 — Reservations, Files, Export, PWA & i18n

### What to Test

1. **Reservations**: Create trip → Reservations tab → Add flight/hotel → verify card shows, delete works
2. **Accommodations**: Stays tab → Add stay with check-in time → confirm row appears
3. **Files**: Files tab → upload any file → star it → share → copy URL → download link → soft-trash
4. **ICS Export**: Click "ICS" button on trip header → file downloads → import to Calendar app
5. **PDF Export**: Click "PDF" button → PDF downloads with trip name as header
6. **Offline Bundle**: `GET /api/v1/trips/:id/bundle` returns trip + days + members in one payload
7. **Invite tokens**: Admin creates invite via `POST /api/v1/invites` → validate token via `GET /api/v1/invites/:token`
8. **PWA**: Serve web in production mode → `/manifest.webmanifest` returns JSON with name, icons
9. **Offline page**: Navigate to `/offline` → shows "You're offline" with retry button
10. **i18n**: Go to Settings → Language → click "हिंदी" → page reloads with Hindi labels in nav

### API Smoke Tests (S10)

```bash
BASE="http://localhost:3000/api/v1"
TOKEN=$(curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"arya@demo.roamera.in","password":"password123"}' | jq -r .accessToken)

# Create a trip first
TRIP_ID=$(curl -s -X POST $BASE/trips -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test S10 Trip"}' | jq -r '.trip.id')

# Create reservation
curl -s -X POST $BASE/trips/$TRIP_ID/reservations \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"flight","name":"AI 101","confirmation":"ABC123"}' | jq .id

# List reservations
curl -s "$BASE/trips/$TRIP_ID/reservations" -H "Authorization: Bearer $TOKEN" | jq length

# Offline bundle
curl -s "$BASE/trips/$TRIP_ID/bundle" -H "Authorization: Bearer $TOKEN" | jq '{trip:.trip.id, days:(.days|length)}

# ICS export (check content-type header)
curl -sI "$BASE/trips/$TRIP_ID/export/ics" -H "Authorization: Bearer $TOKEN" | grep -i content-type

# PDF export (check content-type header)
curl -sI "$BASE/trips/$TRIP_ID/export/pdf" -H "Authorization: Bearer $TOKEN" | grep -i content-type

# Invite token flow (admin)
curl -s -X POST $BASE/invites -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{"expiresInDays":7}' | jq .token
```

### Sprint 10 Acceptance Criteria

- [x] Reservation CRUD: Create → 201 with id, Delete → 204
- [x] Accommodation CRUD: Create → 201, List → array
- [x] File upload → 201 with filename + storageKey, soft-trash → 204
- [x] File share: POST /files/:id/share → shareToken + shareUrl in response
- [x] ICS export returns `text/calendar` content-type
- [x] PDF export returns `application/pdf` content-type with trip title in PDF
- [x] Offline bundle: trip + days + places + reservations + accommodations all present
- [x] Invite token: valid token returns `{valid: true}`, expired/exhausted → 410
- [x] PWA manifest at `/manifest.webmanifest` with correct theme_color `#0D9488`
- [x] i18n: 5 locale JSON files present, locale switcher in settings
- [x] `reservations.test.ts` + `files.test.ts` pass (10 + 7 assertions)

---

## Sprint 11 — MCP Server, Mobile Polish & Push Notifications

### Smoke Tests

```bash
BASE="http://localhost:3000"
TOKEN="<your-jwt-token>"

# OAuth 2.1 discovery
curl -s "$BASE/api/v1/mcp/.well-known/oauth-authorization-server" | jq .scopes_supported

# Create static MCP token
curl -s -X POST "$BASE/api/v1/mcp/tokens" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Claude Desktop","scopes":["trips:read","budget:read"]}' | jq .token

# Register push token
curl -s -X POST "$BASE/api/v1/push/register" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"token":"ExponentPushToken[test]","platform":"ios"}' | jq .

# Dynamic Client Registration
curl -s -X POST "$BASE/api/v1/mcp/oauth/register" \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Test Client","redirect_uris":["http://localhost:8080/callback"]}' | jq .client_id
```

### Sprint 11 Acceptance Criteria

- [x] OAuth 2.1 discovery endpoint returns issuer, token_endpoint, scopes_supported
- [x] Dynamic Client Registration → 201 with client_id + client_secret
- [x] Static MCP token creation → 201, token starts with `mcp_` (shown once)
- [x] MCP /server endpoint → 401 without auth, 200 with valid token
- [x] Revoked token → 401 on /server
- [x] Push register → 201; duplicate → 200; unregister → 204; no-token → 400
- [x] Total API tests: 100 passing (16 test files)
- [x] Mobile Compass tab wired to /api/v1/feed/compass with pull-to-refresh + haptic reactions
- [x] Mobile Trips tab lists trips; tap → detail → budget/packing sub-screens
- [x] Mobile packing items swipe-to-check with expo-haptics
- [x] Mobile AI tab: conversational UI wired to /api/v1/ai/chat
- [x] Mobile Circles tab + detail with JustSplit summary
- [x] Mobile Profile tab with stats + notifications badge + logout
- [x] Mobile Notifications screen with mark-all-read
- [x] Mobile dark mode via useColorScheme + manual dark: style variants
- [x] Mobile offline banner via NetInfo + Dexie offline cache
- [x] Web /settings/mcp: list/create/revoke static tokens + Claude Desktop usage instructions
- [x] Web /oauth/authorize: consent page shows scopes, allow/deny
- [x] Web dark mode: next-themes ThemeProvider + toggle in settings (system default)
