# Implementation Plan: Zero-Cost Caching System for ParikshAI

## Goal Description
ParikshAI currently experiences redundant network requests and database queries across both frontend and backend:
1. **Supabase Auth roundtrips**: Every API call (`/api/chat`, `/api/chats`, `/api/progress`, `/api/me/plan`, `/api/mcq/generate`, `/api/mcq/submit`) verifies the Bearer token by making a remote network request to `supabase.auth.get_user(token)`.
2. **Profile & Quota queries**: User profile and subscription status are repeatedly read from PostgreSQL on every interaction.
3. **Dashboard & Progress recalculation**: The `/api/progress` endpoint scans `user_progress` and `weak_topics` on every navigation to the Progress tab, causing unnecessary database load and visible skeleton loading states.
4. **Chat list refetching**: Navigating between routes triggers redundant `listChats()` calls.

The user recommended using a **free caching method: "Next.js built-in cache"** (`unstable_cache`, Data Cache, `revalidateTag`).

---

## Architectural Reality & Design Analysis

> [!IMPORTANT]
> **Stack Reality Check:**
> The current codebase (`parikshai`) is **NOT** a Next.js application:
> - **Frontend**: React 19 SPA built with **Vite 8** and **React Router DOM 7** (`frontend/package.json`).
> - **Backend**: Python **FastAPI** (`backend/main.py`) handling Gemini AI, Supabase queries, and Razorpay billing.
>
> **Next.js built-in cache** (`unstable_cache`, `revalidateTag`, `fetch` cache) requires a Next.js Server / App Router runtime. It cannot be directly imported into a Vite SPA or a Python FastAPI backend.

To ensure "open code" (or any developer) can immediately execute the right path without confusion or build failures, this plan specifies two distinct options:

- **Option A (Recommended — Zero-Cost Caching in Current Architecture)**:
  Achieve the exact same zero-cost, infrastructure-free caching experience within the existing Vite + FastAPI stack:
  1. **Client-side SWR / TanStack Query cache**: In-memory caching with Stale-While-Revalidate, automatic request deduplication, and tag/key invalidation on mutations (eliminates duplicate fetches for `/progress`, `/me/plan`, and `/chats`).
  2. **FastAPI in-memory TTL Cache (`cachetools`)**: Zero-infrastructure memory caching for Supabase Auth token validation (2 min TTL), user profile/plan data (1 min TTL), and progress dashboard metrics (5 min TTL) with instant invalidation upon mutations.
  3. **Zero external services needed**: $0 hosting cost, no Redis, no Memcached.

- **Option B (Full Migration to Next.js 15 App Router for Next.js Built-in Cache)**:
  If the explicit goal is to transition the frontend to Next.js to use Next.js's native `unstable_cache` and Data Cache on Vercel:
  1. Migrate Vite SPA to Next.js 15 (App Router).
  2. Replace React Router with Next.js App Router conventions (`/app/page.jsx`, `/app/dashboard/page.jsx`, etc.).
  3. Wrap data fetchers with `unstable_cache` and use `revalidateTag()` on chat/MCQ mutations.

---

## User Review Required

> [!WARNING]
> **Choose Implementation Strategy Before Execution:**
> - If you want the fastest, zero-breaking-change solution that keeps your existing Vite + FastAPI stack intact and costs **$0**, approve **Option A**.
> - If you specifically want to replace Vite with **Next.js 15 App Router** so you can use `unstable_cache` and Next.js server caching on Vercel, approve **Option B**.

---

## Open Questions

> [!NOTE]
> 1. **Do you prefer Option A (Vite + FastAPI in-memory cache) or Option B (Migrate frontend to Next.js 15)?**
>    *(Option A provides the exact same caching benefits with 0 risk to existing UI and routing).*
> 2. **Cache duration for Gemini MCQ Generation**: Should identical MCQ requests (same exam, subject, language) be cached for 1 hour to preserve AI quotas, or should AI generation always remain real-time?

---

# OPTION A: Zero-Cost Caching in Existing Vite + FastAPI Architecture (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser (Vite)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Client Cache (TanStack Query / Cache Provider)        │  │
│  │ - Stale-While-Revalidate for chats, plan, progress    │  │
│  │ - Instant UI navigation (no repeated skeleton loaders)│  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTPS (Deduplicated)
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Backend Server                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ In-Memory TTLCache (cachetools - 0 cost)              │  │
│  │ ├─ Auth Token Cache (120s TTL) -> 90% auth speedup    │  │
│  │ ├─ User Plan Cache (60s TTL)   -> instant quota check │  │
│  │ └─ Progress Cache (300s TTL)   -> instant dashboard   │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ Cache Miss Only
┌──────────────────────────────▼──────────────────────────────┐
│                    Supabase PostgreSQL                      │
└─────────────────────────────────────────────────────────────┘
```

### Component 1: Backend In-Memory Cache Layer (`backend/`)

#### [MODIFY] `backend/requirements.txt`
Add `cachetools`:
```diff
 fastapi
 uvicorn
 supabase
 python-dotenv
 google-genai
 httpx
+cachetools
```

#### [NEW] `backend/services/cache_service.py`
Create a centralized in-memory cache service with explicit tag/key invalidation:

```python
"""
Zero-cost, in-memory caching service using cachetools.
No external Redis or Memcached required.
"""
from typing import Any, Callable, Optional
from cachetools import TTLCache
import time

# Cache pools with dedicated TTLs and capacities
# 1. Auth cache: 2 minutes TTL (drastically reduces Supabase Auth network latency)
auth_cache = TTLCache(maxsize=2000, ttl=120)

# 2. User profile/plan cache: 60 seconds TTL (invalidated on payment/quota)
profile_cache = TTLCache(maxsize=1000, ttl=60)

# 3. User progress dashboard cache: 5 minutes TTL (invalidated on MCQ submit)
progress_cache = TTLCache(maxsize=1000, ttl=300)

# 4. Chat sessions list cache: 60 seconds TTL (invalidated on create/delete/update)
chats_cache = TTLCache(maxsize=1000, ttl=60)


def get_cached_auth_user(token: str) -> Optional[Any]:
    return auth_cache.get(token)


def set_cached_auth_user(token: str, user: Any) -> None:
    auth_cache[token] = user


def get_cached_profile(user_id: str) -> Optional[dict]:
    return profile_cache.get(user_id)


def set_cached_profile(user_id: str, profile: dict) -> None:
    profile_cache[user_id] = profile


def invalidate_user_profile(user_id: str) -> None:
    profile_cache.pop(user_id, None)


def get_cached_progress(user_id: str) -> Optional[dict]:
    return progress_cache.get(user_id)


def set_cached_progress(user_id: str, data: dict) -> None:
    progress_cache[user_id] = data


def invalidate_user_progress(user_id: str) -> None:
    progress_cache.pop(user_id, None)


def get_cached_chats(user_id: str) -> Optional[list]:
    return chats_cache.get(user_id)


def set_cached_chats(user_id: str, chats: list) -> None:
    chats_cache[user_id] = chats


def invalidate_user_chats(user_id: str) -> None:
    chats_cache.pop(user_id, None)
```

#### [MODIFY] `backend/services/chat_store.py`
Integrate token caching and chat session list caching with cache invalidation:
```python
# In get_user_id_from_auth:
from services.cache_service import get_cached_auth_user, set_cached_auth_user

def get_user_id_from_auth(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    cached_user_id = get_cached_auth_user(token)
    if cached_user_id:
        return cached_user_id

    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        user_id = user.user.id
        set_cached_auth_user(token, user_id)
        return user_id
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Unauthorized") from exc
```
Invalidate `invalidate_user_chats(user_id)` inside `create_session`, `update_session`, and `archive_session`.

#### [MODIFY] `backend/routers/progress.py`
Add caching for user progress:
```python
from services.cache_service import (
    get_cached_progress,
    set_cached_progress,
    invalidate_user_progress,
)

@router.get("/progress")
async def get_progress(authorization: str = Header(...)):
    user_id = get_user_id_from_auth(authorization)
    require_pro(user_id, "Progress dashboard")

    cached = get_cached_progress(user_id)
    if cached:
        return cached

    # ... compute progress metrics ...
    result = {
        "total_answered": total_answered,
        "correct": correct,
        "wrong": wrong,
        "accuracy": accuracy,
        "weak_topics": weak_topics[:5],
        "weak_by_exam": sorted(weak_by_exam.values(), key=lambda i: i["wrong_count"], reverse=True),
        "recent_attempts": recent_attempts,
        "recommendation": recommendation,
    }
    set_cached_progress(user_id, result)
    return result
```

#### [MODIFY] `backend/routers/mcq.py`
In `submit_mcq`: invalidate the user's progress cache immediately so the next dashboard visit reflects the latest stats:
```python
# After inserting attempt in user_progress:
from services.cache_service import invalidate_user_progress

invalidate_user_progress(req.user_id)
```

---

### Component 2: Frontend Client-Side Cache Layer (`frontend/`)

#### [MODIFY] `frontend/package.json`
Add `@tanstack/react-query` (or a lightweight zero-dependency API cache manager):
```diff
   "dependencies": {
     "@supabase/supabase-js": "^2.105.4",
+    "@tanstack/react-query": "^5.66.0",
     "axios": "^1.16.1",
     "react": "^19.2.6",
```

#### [NEW] `frontend/src/lib/queryClient.js`
Configure TanStack Query client with standard caching policies:
```javascript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // Data fresh for 2 minutes
      gcTime: 1000 * 60 * 10,   // Cached in memory for 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

#### [MODIFY] `frontend/src/main.jsx`
Wrap the root application in `QueryClientProvider`:
```jsx
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'

// Wrap <App /> with <QueryClientProvider client={queryClient}>
```

#### [MODIFY] `frontend/src/pages/AppShell.jsx`, `Dashboard.jsx`, and `Billing.jsx`
Use `useQuery` / `useMutation` for seamless caching:
- In `AppShell.jsx`:
  ```javascript
  const { data: chatHistory = [], isLoading: loadingChats } = useQuery({
    queryKey: ['chats'],
    queryFn: listChats,
  })
  // On chat delete or create:
  queryClient.invalidateQueries({ queryKey: ['chats'] })
  ```
- In `Dashboard.jsx`:
  ```javascript
  const { data, isLoading, error } = useQuery({
    queryKey: ['progress'],
    queryFn: getProgress,
  })
  ```
- In `Billing.jsx`:
  ```javascript
  const { data: plan, isLoading } = useQuery({
    queryKey: ['plan'],
    queryFn: getPlan,
  })
  ```

---

# OPTION B: Next.js 15 App Router Built-in Cache Migration Plan

If the requirement is explicitly to utilize **Next.js built-in cache (`unstable_cache`, Next Data Cache, `revalidateTag`)**, follow this migration:

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js 15 (App Router on Vercel)           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Next.js Data Cache (unstable_cache)                   │  │
│  │ ├─ Tags: ['user-[id]-chats']                          │  │
│  │ ├─ Tags: ['user-[id]-progress']                       │  │
│  │ └─ Tags: ['user-[id]-plan']                           │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              │ revalidateTag(...) on mut.   │
└──────────────────────────────┼──────────────────────────────┘
                               │ Fetch / Backend Proxy
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI / Supabase DB                    │
└─────────────────────────────────────────────────────────────┘
```

### Component 1: Next.js Setup & Configuration

#### [MODIFY] `frontend/package.json`
Replace Vite with Next.js 15:
```diff
-   "vite": "^8.0.12",
-   "@vitejs/plugin-react": "^6.0.1",
-   "react-router-dom": "^7.15.1"
+   "next": "^15.1.0"
```

#### [NEW] `frontend/next.config.mjs`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_API_URL || 'http://127.0.0.1:8000'}/api/:path*`,
      },
    ]
  },
}
export default nextConfig
```

### Component 2: Next.js Built-in Cache Wrappers

#### [NEW] `frontend/src/lib/cachedApi.js`
Use Next.js's native `unstable_cache` with tag-based revalidation:
```javascript
import { unstable_cache } from 'next/cache'

// Cached fetcher for user progress with 5-minute TTL and tag-based invalidation
export const getCachedProgress = (userId, token) => {
  return unstable_cache(
    async () => {
      const res = await fetch(`${process.env.BACKEND_URL}/api/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch progress')
      return res.json()
    },
    [`progress-${userId}`],
    {
      revalidate: 300, // 5 minutes
      tags: [`user-progress-${userId}`],
    }
  )()
}

// Cached fetcher for user chats
export const getCachedChats = (userId, token) => {
  return unstable_cache(
    async () => {
      const res = await fetch(`${process.env.BACKEND_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch chats')
      const data = await res.json()
      return data.chats
    },
    [`chats-${userId}`],
    {
      revalidate: 60, // 1 minute
      tags: [`user-chats-${userId}`],
    }
  )()
}
```

#### [NEW] `frontend/src/app/actions/revalidate.js`
Server Actions to trigger cache revalidation on mutations:
```javascript
'use server'

import { revalidateTag } from 'next/cache'

export async function revalidateUserProgress(userId) {
  revalidateTag(`user-progress-${userId}`)
}

export async function revalidateUserChats(userId) {
  revalidateTag(`user-chats-${userId}`)
}
```

---

## Verification Plan

### Automated Tests
1. **Cache Hit Verification Test (Backend In-Memory Cache)**:
   Create a test script `backend/test_cache.py`:
   - Send two sequential requests to `/api/me/plan` with the same Bearer token.
   - Assert response time of request 2 is `< 10ms` (served from memory without Supabase roundtrip).
   - Verify `auth_cache` and `profile_cache` hit counters increment.
   ```bash
   cd backend && pytest test_cache.py -v
   ```

2. **Cache Invalidation Test (Backend)**:
   - Call `/api/progress` -> cache filled.
   - Call `/api/mcq/submit` -> verify `invalidate_user_progress` removes entry.
   - Call `/api/progress` -> verify fresh data returned.

3. **Frontend Build & Lint**:
   ```bash
   cd frontend && npm run build
   ```

### Manual Verification
1. **Network Tab Deduplication**:
   - Open Chrome DevTools Network Tab.
   - Click between "Chat", "Progress", and "Billing".
   - Verify that re-visiting "Progress" or "Billing" loads instantly without triggering new network requests or showing skeleton loaders.
2. **Quota / Score Real-time Invalidation**:
   - Answer an MCQ question on the MCQ practice page.
   - Navigate to "Progress" dashboard.
   - Confirm accuracy and total answered immediately reflect the newly submitted question.
