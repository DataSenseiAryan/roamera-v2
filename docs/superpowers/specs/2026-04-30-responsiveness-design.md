# Responsive Overhaul Design Spec

**Date:** 2026-04-30
**Goal:** Make the entire Roamera app work correctly on mobile (375–430px), tablet (768px), and desktop (1024px+) without breaking any existing functionality.

---

## Problem Statement

Several pages have layout issues on small screens:
- Hardcoded heights/paddings that overflow or clip content
- Text too small to read on 375px
- No search access at <400px (Navbar search hides completely)
- Profile tab in BottomNav requires knowing your own user ID — awkward UX

---

## Approach

**Co-located Tailwind responsive classes** — fix each broken page in-file using `sm:`, `md:`, `lg:` prefixes. No new `index.css` media queries. Add one new component (`SearchOverlay`) to solve the mobile search dead zone.

---

## Architecture

### New Component: `SearchOverlay.jsx`

Location: `frontend/src/components/SearchOverlay.jsx`

- Fixed full-screen overlay (z-index 300), background `var(--surface)`
- Top bar: back/close arrow + auto-focused `<input>` + clear (`×`) button
- Results: debounced (300ms) call to existing `GET /api/search?q=` endpoint
- Renders two sections: Users (avatar + username) and Journals (photo thumbnail + title + destination)
- Tapping a result navigates to `/users/:id` or `/journals/:id` and closes the overlay
- Escape key closes the overlay
- State (`isSearchOpen: boolean`) owned by `BottomNav` — no global context

### Modified Component: `BottomNav.jsx`

Location: `frontend/src/components/BottomNav.jsx`

Current tabs (5): Compass, Meetways, TravelLens, JustSplit, Miles (Profile)
New tabs (5): Compass, Meetways, TravelLens, JustSplit, **Search**

- Tab 5 icon: `Search` from lucide-react (replaces `Map` / profile icon)
- Tab 5 action: sets `isSearchOpen = true` (does not navigate)
- `<SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />` rendered as sibling inside BottomNav's container
- Active bubble animation (`layoutId="bottomNavBubble"`) only applies to navigation tabs (1–4); Search tab uses a separate highlight style when overlay is open
- BottomNav remains always visible on all screen sizes (existing behavior preserved)

### Modified Component: `Navbar.jsx`

Location: `frontend/src/components/Navbar.jsx`

- Remove `hide-mobile` class from the avatar `<Link to="/users/${user.id}">` (line ~201)
- Profile is now reachable on all screen sizes via the Navbar avatar
- `+ Draft Journal` button and Logout button stay `hide-mobile` (profile page provides those actions)

---

## Per-Page Responsive Fixes

All fixes use Tailwind responsive prefixes. No inline `style` pixel values for layout-critical properties.

### `frontend/src/pages/Login.jsx`
- Card padding: `p-5 sm:p-8` (was `32px 28px` inline)
- Card `maxWidth: 400` → `w-full max-w-[400px]`

### `frontend/src/pages/Register.jsx`
- Same card padding as Login
- Step progress bar labels: `text-[0.6rem] sm:text-xs`
- Password strength bars: ensure `min-w-0` so they don't overflow at 375px

### `frontend/src/pages/JournalForm.jsx`
- Photo upload drop zone: `p-4 sm:p-10`
- Photo preview grid: `grid-cols-2 sm:grid-cols-3`
- Section padding: `px-4 sm:px-6`

### `frontend/src/pages/AIPlanTrip.jsx`
- Hero/header area: replace hardcoded `height: 220` with `minHeight: 140` + `sm:h-[220px]` (or equivalent inline responsive via Tailwind)
- Inner text padding: `px-4 sm:px-8`

### `frontend/src/pages/CreateMeetway.jsx` and `EditMeetway.jsx`
- Section label `text-[0.62rem]` → `text-xs` (0.75rem) — readable on mobile
- Action bar at bottom: `flex-wrap gap-2` so buttons don't clip at 375px
- Button min-width: remove any fixed pixel widths, use `flex-1 min-w-[120px]`

### `frontend/src/pages/Profile.jsx`
- Cover photo container: `h-32 sm:h-[220px]` (was partially patched via index.css — move fix inline, remove CSS override)
- Destination chips row: wrap in `overflow-x-auto` scroll container with `flex-nowrap` so chips scroll horizontally rather than breaking layout

### `frontend/src/pages/PlanTrip.jsx`
- Page heading: `text-xl sm:text-2xl md:text-3xl`
- Sub-text: `text-sm sm:text-base`
- Section cards: `p-4 sm:p-6`

### `frontend/src/pages/Itinerary.jsx`
- Day selector tab bar: wrap in `overflow-x-auto` with `flex-nowrap`
- Hero area: `min-h-[160px] sm:min-h-[240px]` (was gapping at 480px)
- Day header padding: `px-4 sm:px-6`

---

## Data Flow

```
BottomNav
  ├── isSearchOpen: boolean (useState)
  ├── <nav tabs> (1–4 navigate, 5 sets isSearchOpen=true)
  └── <SearchOverlay open={isSearchOpen} onClose={...} />
        ├── query: string (useState)
        ├── results: { users[], journals[] } (useState)
        ├── useEffect → debounced GET /api/search?q=query
        └── renders result list → navigate + onClose on tap
```

---

## What Is Not Changing

- `index.css` token definitions and theme variables (untouched)
- Existing `hide-mobile` and `nav-search` CSS rules (kept as-is)
- Exception: the existing `@media (max-width: 639px)` cover-photo override for Profile will be **removed** from `index.css` once the equivalent fix is inlined into `Profile.jsx`
- Pages already working well: Feed, JournalDetail, MeetwayDetail, Meetways, Search, Onboarding
- BottomNav hide rules (`/login`, `/register`, `/welcome`, `/meetways/create`, `/create`, `*/edit`)
- All backend routes

---

## Success Criteria

- [ ] No horizontal scroll on any page at 375px viewport width
- [ ] All text legible (≥11px rendered) at 375px
- [ ] Search reachable on mobile via BottomNav Search tab
- [ ] Profile reachable on mobile via Navbar avatar
- [ ] BottomNav visible on mobile, tablet, and desktop
- [ ] No regressions on desktop layout
