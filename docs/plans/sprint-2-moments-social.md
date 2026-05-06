# Sprint 2 — Moments & Social Feed (As-Built)

**Status: ✅ Complete**  
**Implemented: May 2026**

---

## Goal

Build the social core of Roamera: posts (Moments), reactions, comments, Compass feed, destinations, saved posts, and bucket list.

---

## Architecture

```
Web (Next.js) → POST /api/v1/posts          (create moment)
              → PATCH /api/v1/posts/:id     (edit)
              → DELETE /api/v1/posts/:id    (delete)
              → POST /api/v1/posts/:id/photos (upload photos)
              → POST /api/v1/posts/:id/reactions (toggle reaction)
              → POST /api/v1/posts/:id/comments (add comment)
              → GET  /api/v1/feed/compass   (paginated feed)
              → GET  /api/v1/feed/search    (unified search)
              → GET  /api/v1/feed/trending  (trending topics)
              → GET  /api/v1/feed/destinations
              → GET  /api/v1/feed/destinations/:id
              → GET  /api/v1/feed/saved
              → GET  /api/v1/feed/bucket-list
```

---

## Key Files Implemented

| File | Description |
|------|-------------|
| `apps/api/src/routes/posts.ts` | Full CRUD posts, photos, reactions, comments |
| `apps/api/src/routes/feed.ts` | Compass feed, search, trending, destinations, saved, bucket-list |
| `apps/api/src/db/schema.ts` | posts, postPhotos, reactions, comments, savedPosts, bucketList, destinations |
| `packages/types/src/schemas/posts.ts` | Zod schemas for all Sprint 2 types |
| `packages/sdk/src/hooks/posts.ts` | TanStack Query hooks for all post/feed operations |
| `apps/web/src/app/(app)/home/page.tsx` | Compass feed with infinite scroll + trending sidebar |
| `apps/web/src/app/(app)/moments/[postId]/page.tsx` | Post detail with reactions + comments |
| `apps/web/src/app/(app)/destinations/page.tsx` | Destination grid with category filter |
| `apps/web/src/app/(app)/destinations/[id]/page.tsx` | Destination detail with recent posts |
| `apps/web/src/app/(app)/saved/page.tsx` | Saved posts + bucket list tabs |
| `apps/web/src/app/(app)/search/page.tsx` | Search UI for posts, people, destinations |
| `apps/web/src/components/posts/post-card.tsx` | Feed card component |
| `apps/web/src/components/posts/reaction-bar.tsx` | 5-reaction bar component |
| `apps/web/src/components/posts/comments-section.tsx` | Comments UI |
| `apps/web/src/components/posts/create-moment-modal.tsx` | Multi-step post creation modal |

---

## Reaction Set (all 5 implemented)

| Emoji | Label | DB Key | Behavior |
|-------|-------|--------|---------|
| ❤️ | Love | `love` | Standard like |
| 🔥 | Epic | `epic` | High-energy endorsement |
| 🌍 | Wander | `wander` | Inspiration |
| 📍 | Wanna Go | `wanna_go` | Saves to bucket list |
| 🤩 | Amazing | `amazing` | Discovery delight |

---

## Definition of Done — All Checked ✅

- [x] Create post with title, content, destinations, activities, hashtags
- [x] Upload 1-5 photos per post
- [x] All 5 reactions (wanna_go adds to bucket list)
- [x] Comments (create, edit, delete)
- [x] Compass feed (global + following, cursor-paginated)
- [x] Search (posts + users + destinations)
- [x] Trending (destinations + hashtags)
- [x] Destination detail page
- [x] Saved posts
- [x] Bucket list

---

## Demo Credentials

Password: `password123` for all

| arya_explorer | marco_travels | leo_backpacker | ana_nomad | kenji_wanders |
