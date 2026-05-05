# Roamera Mobile App — Auth Flow Design

**Date:** 2026-04-26  
**Scope:** Onboarding, Login, Register → Home (Android & iOS)  
**Status:** Approved

---

## 1. Overview

Add a React Native (Expo) mobile app at `fullstack/mobile-app/` that shares the existing Express backend with the web frontend. Zero backend changes required. The mobile app covers only the auth flow (onboarding, register, login) until the user reaches the Home screen.

---

## 2. Tech Stack

| Concern | Choice | Reason |
|---------|--------|--------|
| Framework | Expo (managed workflow) | Fastest setup, single codebase for Android + iOS, OTA updates |
| Routing | Expo Router (file-based) | Maps to web mental model, built-in auth guards via layouts, deep linking |
| Styling | NativeWind v4 | Tailwind class names, consistent with web Tailwind v4 |
| Auth state | Zustand + AsyncStorage | Lightweight global store, cleaner than Context, persists token across sessions |
| HTTP | axios | Mirrors web `api.js`, interceptors for Bearer token + 401 handling |
| Animations | Expo LinearGradient + React Native Animated | Space background on auth screens |

---

## 3. Project Structure

```
fullstack/mobile-app/
├── app/
│   ├── _layout.tsx           # Root layout — auth gate (redirect based on Zustand token)
│   ├── index.tsx             # Entry redirect → onboarding or home
│   ├── (auth)/
│   │   ├── _layout.tsx       # Auth group layout (no tab bar, space background)
│   │   ├── onboarding.tsx    # 3-slide carousel + interest picker
│   │   ├── login.tsx         # Login screen
│   │   └── register.tsx      # Signup screen
│   └── (app)/
│       ├── _layout.tsx       # Tab bar layout (protected, redirects to login if no token)
│       └── index.tsx         # Home screen (welcome header + feed skeleton)
├── src/
│   ├── lib/
│   │   └── api.ts            # Axios instance, Bearer token request interceptor, 401 response interceptor
│   ├── store/
│   │   └── authStore.ts      # Zustand store: { user, token, isLoading }, actions: login/logout/rehydrate
│   ├── components/
│   │   └── SpaceBackground.tsx  # Animated LinearGradient background for auth screens
│   └── constants/
│       └── colors.ts         # Design tokens (primary, background, text, error)
├── .env.example              # EXPO_PUBLIC_API_URL
├── app.json                  # Expo config (name: Roamera, slug: roamera)
├── package.json
├── tsconfig.json
└── tailwind.config.js        # NativeWind config pointing to app/ and src/
```

---

## 4. Auth Flow & Navigation

### Onboarding Gate
- AsyncStorage key: `roamera_onboarded` (mirrors web localStorage key)
- First launch → `/onboarding` → user taps "Get Started" → sets flag → `/register`
- Subsequent launches (flag set, no token) → skip onboarding → `/login`

### Navigation Decision Tree
```
App Launch
    │
    ├── hasToken? ──yes──→ validate via GET /api/users/me
    │                           ├── valid → (app)/index  [Home]
    │                           └── 401  → clear token → (auth)/login
    │
    └── no token
         ├── onboarded? ──yes──→ (auth)/login
         └── no ──────────────→ (auth)/onboarding
                                       │
                          "Get Started"├──────────────→ (auth)/register
                                       │
                       "Sign in" link  └──────────────→ (auth)/login
```

### Auth Guard Implementation
- Root `app/_layout.tsx` reads `token` from Zustand on mount
- Uses Expo Router `<Redirect>` — no imperative `router.push()` needed
- Zustand state change (login/logout) triggers re-render → automatic redirect
- `(app)/_layout.tsx` independently checks token; redirects to login if missing

---

## 5. API Layer

### `src/lib/api.ts`
```typescript
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
})

// Inject Bearer token on every request
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401: clear auth state → Expo Router redirects to login automatically
api.interceptors.response.use(null, error => {
  if (error.response?.status === 401) useAuthStore.getState().logout()
  return Promise.reject(error)
})
```

### Backend Endpoints Used (no backend changes)
| Action | Method | Endpoint | Response |
|--------|--------|----------|----------|
| Register | POST | `/api/auth/register` | `{ user, token }` |
| Login | POST | `/api/auth/login` | `{ user, token }` |
| Restore session | GET | `/api/users/me` | `{ user }` |

### Environment
```
# .env.example
EXPO_PUBLIC_API_URL=http://localhost:3001        # dev (Android emulator: 10.0.2.2:3001)
EXPO_PUBLIC_API_URL=https://your-render-app.onrender.com  # prod
```

> Note: Android emulator cannot reach `localhost` — use `10.0.2.2` for the dev API URL.

---

## 6. State Management

### `src/store/authStore.ts`
```typescript
interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (user: User, token: string) => Promise<void>
  logout: () => Promise<void>
  rehydrate: () => Promise<void>
}
```

- `login()`: saves `user` + `token` to Zustand state AND AsyncStorage
- `logout()`: clears Zustand state AND removes from AsyncStorage
- `rehydrate()`: called once in root layout on mount — reads AsyncStorage, sets state, then validates token via `/api/users/me`
- Zustand `persist` middleware with AsyncStorage adapter handles automatic persistence

---

## 7. Screen Designs

### Onboarding (`(auth)/onboarding.tsx`)
- Full-screen `SpaceBackground` (LinearGradient, animated stars)
- Horizontal `FlatList` with `pagingEnabled` — 3 slides:
  1. **Explore** — "Discover the World" tagline, globe icon
  2. **Journal** — "Capture Every Moment", journal icon
  3. **Connect** — "Travel Together", people icon
- Dot pagination indicator
- Final slide: interest picker grid (Beach, Mountains, City, Desert, Forest, Arctic) — selection saved to AsyncStorage key `roamera_interests`
- "Get Started" CTA button → `/register`
- "Already have an account? Sign in" link → `/login`

### Register (`(auth)/register.tsx`)
- `SpaceBackground` behind a scrollable form card
- Fields: Username, Email, Password (show/hide toggle)
- Password strength bar (weak/medium/strong based on length + character variety)
- Submit: POST `/api/auth/register` → `authStore.login(user, token)` → auto-redirect to Home
- Error state: inline banner below form ("Email already taken", etc.)
- "Already have an account? Sign in" link → `/login`

### Login (`(auth)/login.tsx`)
- `SpaceBackground` behind a form card
- Fields: Email or Username, Password (show/hide toggle)
- Submit: POST `/api/auth/login` → `authStore.login(user, token)` → auto-redirect to Home
- Error state: inline banner ("Invalid credentials")
- "Don't have an account? Sign up" link → `/register`

### Home (`(app)/index.tsx`)
- Header: Roamera logo + user avatar (right)
- Welcome text: "Welcome back, {username}"
- Feed skeleton (3 placeholder cards with shimmer animation)
- Bottom tab bar: Home (active), Search, Create, Profile — all except Home show a "Coming Soon" placeholder

---

## 8. Constraints & Decisions

- **Android emulator localhost:** Use `10.0.2.2` instead of `localhost` in dev `.env`
- **No backend changes:** All existing endpoints work as-is; the backend already returns JSON with CORS enabled
- **Token storage:** AsyncStorage (not SecureStore) for simplicity; upgrade to `expo-secure-store` in a future iteration for production hardening
- **TypeScript:** Full TypeScript throughout mobile-app; strict mode enabled
- **NativeWind v4:** Requires Babel preset `nativewind/babel` and Metro config update
- **Scope boundary:** This design covers auth flow only. Feed, journals, search, meetways, AI planner are out of scope for this iteration.

---

## 9. Out of Scope

The following exist in the web app but are NOT part of this mobile iteration:

- Feed (journal cards, reactions, comments)
- Journal CRUD
- Search
- Profile
- Meetways
- AI Planner
- Budget & packing lists
- Notifications
