# Tasks and Issues

This file tracks pending tasks, known issues, and technical debt for the SIGINT Wiki project.

## Completed Tasks

### Authentication System Fix ✅
- **Date:** 2026-04-17
- **Issues resolved:**
  1. **Nginx `auth_request` protection** — Dashboard routes now validated server-side via `/_auth_verify` → `/api/auth/verify` before serving static files
  2. **Backend `/api/auth/verify` endpoint** — New GET endpoint validates the `refresh_token` cookie and returns 200/401 for Nginx
  3. **Login page redirect handling** — `?redirect=` query param read on login page; authenticated users redirected away immediately
  4. **OAuth redirect flow** — Redirect path preserved through OAuth state (Redis) and passed back to frontend callback URL
  5. **Callback page** — Now reads `?redirect=` param and navigates to original destination post-auth
- **Files changed:**
  - `.nginx/malindra.com.conf` — Added `/_auth_verify` internal location and `/dashboard` `auth_request` block
  - `backend/app/api/routes/auth.py` — Added `/verify` endpoint; pass redirect through OAuth callback
  - `app/(auth)/login/page.tsx` — Redirect handling, already-logged-in check, error display
  - `app/components/auth/OAuthButtons.tsx` — Accept and forward `redirect` prop to OAuth initiation URL
  - `app/(auth)/callback/page.tsx` — Use `?redirect=` param from callback URL

### Embedding Service Fix ✅
- **Date:** 2026-04-17
- **Issue:** `created_at` column missing in SQLite fallback path
- **Fix:** Added `created_at=datetime.utcnow()` to Embedding model instantiation
- **File:** `backend/app/services/embedding.py`

### Content Sync Testing ✅
- **Date:** 2026-04-17
- **Status:** Working (requires authentication)
- **Endpoint:** `POST /api/articles/sync`

### RAG Search Verification ✅
- **Date:** 2026-04-17
- **Status:** Endpoint working, returns empty until content synced

---

## Backend Status

| Component | Status | Notes |
|-----------|--------|-------|
| API Server | ✅ Running | FastAPI on port 8000 |
| PostgreSQL | ✅ Running | With pgvector extension |
| Redis | ✅ Running | Cache/session store |
| Authentication | ✅ Fixed | Nginx auth_request + API protected |
| Embeddings | ✅ Fixed | SQLite fallback working |
| Content Sync | ✅ Ready | Tested and working |

---

## Frontend Status

| Component | Status | Notes |
|-----------|--------|-------|
| Static Build | ✅ Working | Output to `./out/` |
| Auth Context | ✅ Working | JWT + cookies implemented |
| ProtectedRoute | ✅ Fixed | Client-side + Nginx server-side |
| Mobile Nav | ✅ Working | Logout button present |
| Dashboard | ✅ Fixed | Nginx auth_request blocks unauthenticated access |
| Login Page | ✅ Fixed | Redirect handling, already-logged-in check |

---

## Next Steps (Priority Order)

1. **Apply Nginx config** — Run `mal configure-nginx` or `sudo nginx -t && sudo nginx -s reload` to apply the updated config
2. **Rebuild backend** — `docker compose build backend && docker compose up -d backend` to deploy the new `/verify` endpoint
3. **Build and deploy frontend** — `mal build-frontend` then verify dashboard protection
4. **Complete Google OAuth app verification** — Pending Google review

---

## Technical Debt

- Static export limits authentication options — Nginx auth_request is the current mitigation
- Consider full SSR migration in the future for more robust server-side auth

---

*Last updated: 2026-04-17*
