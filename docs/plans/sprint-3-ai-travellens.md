# Sprint 3 — AI Planner, TravelLens & Project Hygiene (As-Built)

**Status: ✅ Complete**  
**Implemented: May 2026**

---

## Goal

Build the AI trip planner (conversational, streaming), TravelLens flight/hotel search with deep-links, fix S1/S2 debt, establish sprint verification framework, and update all architecture docs.

---

## Architecture

```
Web (Next.js) → POST /api/v1/ai/plan        (AI itinerary generation)
              → POST /api/v1/ai/plan/refine  (SSE streaming refinement)
              → POST /api/v1/ai/optimize-budget
              → POST /api/v1/ai/caption      (image captioning)
              → POST /api/v1/ai/hashtags     (hashtag suggestions)
              → GET  /api/v1/travel/airports (autocomplete)
              → GET  /api/v1/travel/flights  (search + deep-links)
              → GET  /api/v1/travel/hotels   (search + deep-links)
              
Node API → HMAC-signed requests → FastAPI (Python)
FastAPI  → Gemini 2.0 Flash (primary) → Groq (fallback)
Travel   → Amadeus Self-Service API (mock fallback if not configured)
```

### HMAC Signing Protocol

```
timestamp = Date.now() (milliseconds)
bodyHash  = SHA-256(JSON.stringify(body))
message   = `${timestamp}.${bodyHash}`
token     = HMAC-SHA256(AI_SERVICE_SECRET, message)
Headers: X-Service-Token: <token>, X-Timestamp: <timestamp>
```

### SSE Streaming Flow

1. Web calls `POST /api/v1/ai/plan/refine` 
2. Node proxies to FastAPI with `responseType: 'stream'`
3. FastAPI streams `data: {chunk}\n\n` tokens
4. Node pipes the stream through to browser
5. Web reads with `fetch()` + `ReadableStream`

---

## Key Files Created/Modified

### Python AI Service

| File | Description |
|------|-------------|
| `apps/ai-service/src/routes/plan.py` | `/plan`, `/plan/refine` (SSE), `/optimize-budget` |
| `apps/ai-service/src/routes/caption.py` | `/caption`, `/hashtags` |
| `apps/ai-service/src/prompts/plan.jinja2` | Itinerary generation prompt template |
| `apps/ai-service/src/prompts/refine.jinja2` | Refinement prompt template |
| `apps/ai-service/src/prompts/caption.jinja2` | Photo captioning prompt |
| `apps/ai-service/src/prompts/hashtags.jinja2` | Hashtag generation prompt |
| `apps/ai-service/src/models/plan.py` | Pydantic models: AIItinerary, DayPlan, Place etc. |

### Node API

| File | Description |
|------|-------------|
| `apps/api/src/lib/hmac.ts` | HMAC signing utility for service-to-service auth |
| `apps/api/src/routes/ai.ts` | HMAC proxy to FastAPI (plan, refine SSE, optimize, caption, hashtags) |
| `apps/api/src/routes/travel.ts` | Amadeus flights/hotels/airports + deep-link generation |
| `apps/api/src/routes/index.ts` | Registered AI + travel routers |
| `apps/api/src/app.ts` | Wired idempotency middleware |

### Types & SDK

| File | Description |
|------|-------------|
| `packages/types/src/schemas/ai.ts` | AI plan Zod schemas |
| `packages/types/src/schemas/travel.ts` | Flight/hotel/airport Zod schemas |
| `packages/sdk/src/hooks/ai.ts` | useAIPlan, useOptimizeBudget, streamRefinePlan, useCaption, useHashtags |
| `packages/sdk/src/hooks/travel.ts` | useFlightSearch, useHotelSearch, useAirportSearch |

### Web

| File | Description |
|------|-------------|
| `apps/web/src/app/(app)/ai-planner/page.tsx` | Chat UI + streaming response + itinerary panel |
| `apps/web/src/app/(app)/travel/page.tsx` | TravelLens: flight + hotel search with deep-links |
| `apps/web/src/app/(app)/search/page.tsx` | Search page (debt fix from S2) |
| `apps/web/src/app/(app)/destinations/[id]/page.tsx` | Destination detail (debt fix from S2) |
| `apps/web/src/components/ai/chat-message.tsx` | Chat bubble component |
| `apps/web/src/components/ai/itinerary-card.tsx` | Day itinerary card |
| `apps/web/src/components/travel/flight-card.tsx` | Flight result with deep-links |
| `apps/web/src/components/travel/hotel-card.tsx` | Hotel result with deep-links |
| `apps/web/src/components/navbar.tsx` | Added Search, AI Planner, TravelLens links |

### S1/S2 Debt Fixes

| Fix | Description |
|-----|-------------|
| Idempotency middleware | Wired in `app.ts` before routes |
| Public profile | Changed `/:username` to use `optionalAuthenticate` |
| User posts API | Added `GET /api/v1/users/:userId/posts` dedicated endpoint |
| useUserPostsQuery | New SDK hook replacing client-side feed filter in profile page |
| Search UI | Created `/search` page |
| Destination detail | Created `/destinations/[id]` page |
| Trending sidebar | Added to Compass feed homepage |
| Save cache fix | Added `postKeys.saved()` invalidation in useSavePost/useUnsavePost |
| Bucket list dedup | Added `uniqueIndex` on (userId, postId) in bucket_list schema |

---

## External Services

| Service | Usage | Free Tier |
|---------|-------|-----------|
| Google Gemini 2.0 Flash | AI itinerary generation | 1500 req/day |
| Groq Llama 3.3 | Fallback LLM | Free |
| Amadeus Self-Service | Flight/hotel search | 2000 calls/mo |
| Skyscanner deep-link | Flight booking | URL only, free |
| Google Flights deep-link | Flight booking | URL only, free |
| Booking.com deep-link | Hotel booking | URL only, free |

---

## Definition of Done — All Checked ✅

- [x] AI plan generates 5-day itinerary
- [x] Refine "make it cheaper" updates itinerary (SSE streaming)
- [x] Optimize Budget button reduces costs
- [x] Export saves itinerary as JSON
- [x] Flight search returns results with working deep-links
- [x] Hotel search returns results with Booking.com links
- [x] Airport autocomplete works (with mock fallback)
- [x] Caption endpoint accepts image URL
- [x] Hashtags endpoint returns travel hashtags with #roamera
- [x] All S1/S2 debt fixes in place
- [x] Sprint verification doc created
- [x] Architecture docs updated
- [x] Sprint plans archived to docs/plans/

---

## Demo Script

See `docs/sprint-verification.md` for the full Sprint 3 demo walkthrough.
