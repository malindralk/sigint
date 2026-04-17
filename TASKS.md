# Tasks and Issues

This file tracks pending tasks, known issues, and technical debt for the SIGINT Wiki project.

## Critical Issues

### Authentication System - CRITICAL

**Status:** 🔴 **CRITICAL - Pages Not Protected**

**Problem:** The authentication system has fundamental flaws that make it ineffective:

1. **No Middleware Protection**
   - No `middleware.ts` file exists
   - All routes are publicly accessible
   - Client-side `ProtectedRoute` only hides UI after page loads

2. **Static Export Bypasses Auth**
   - Using `output: 'export'` generates static HTML
   - All pages in `/out/` are publicly served by Nginx
   - Auth checks only happen client-side after hydration
   - Disabling JavaScript bypasses all protection

3. **Login Page Issues**
   - No redirect handling after login
   - No "already logged in" check
   - Users can't access dashboard even after successful auth

**Affected Files:**
- `app/(dashboard)/layout.tsx` - Client-side only protection
- `app/(auth)/login/page.tsx` - Missing redirect logic
- `app/middleware.ts` - **MISSING FILE**
- `next.config.js` - Static export incompatible with auth

**Impact:**
- Dashboard, user management, settings pages are publicly accessible
- Authentication is effectively pointless for page access
- API endpoints ARE protected (only working part)

**Recommended Solutions:**

**Option 1: Convert to SSR (Recommended)**
Remove `output: 'export'` and implement proper server-side rendering with middleware.

**Option 2: Add Edge Middleware**
Create `app/middleware.ts` to check auth cookies at the edge (requires moving away from static export).

**Option 3: Client-Only Dashboard**
Use `export const dynamic = 'force-dynamic'` for dashboard pages (partial fix).

---

## Completed Tasks

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
| Authentication | ⚠️ Partial | API protected, pages not protected |
| Embeddings | ✅ Fixed | SQLite fallback working |
| Content Sync | ✅ Ready | Tested and working |

---

## Frontend Status

| Component | Status | Notes |
|-----------|--------|-------|
| Static Build | ✅ Working | Output to `./out/` |
| Auth Context | ✅ Working | JWT + cookies implemented |
| ProtectedRoute | ⚠️ Partial | Client-side only |
| Mobile Nav | ✅ Working | Logout button present |
| Dashboard | ⚠️ Broken | Accessible without auth |
| Login Page | ⚠️ Broken | No redirect handling |

---

## Next Steps (Priority Order)

1. **Fix Authentication Architecture**
   - Decide on SSR vs static export approach
   - Implement proper route protection
   - Add middleware or server-side checks

2. **Fix Login Redirect**
   - Handle `?redirect=` query parameter
   - Redirect authenticated users away from login

3. **Test Complete Auth Flow**
   - Login → Dashboard → Logout
   - Verify protected pages block unauthenticated users
   - Test role-based access control

4. **Security Audit**
   - Review all API endpoints
   - Verify JWT token handling
   - Check session management

---

## Technical Debt

- Static export limits authentication options
- Need to migrate from static export for proper auth
- Consider Next.js App Router SSR approach
- Evaluate if static site is the right architecture for authenticated content

---

*Last updated: 2026-04-17*
