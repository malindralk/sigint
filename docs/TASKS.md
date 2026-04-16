# Authentication, Authorization, Session Management & Admin Dashboard - Implementation Tasks

## Overview

This document provides a detailed task breakdown for implementing the authentication, authorization, session management, and admin dashboard system. Tasks are organized in phases following the design document.

---

## Phase 1: Core Authentication (Backend)

### 1. Database Schema Updates

- [ ] 1.1 **Create Alembic migration for auth schema**
  - File: `backend/alembic/versions/002_auth_system.py`
  - Modify `users` table: Add `password_hash`, `is_active`, `is_verified`, `updated_at`, `password_changed_at`
  - Make `oauth_provider` and `oauth_id` nullable
  - Add unique index on `email`
  - Create `sessions` table with all columns
  - Create `oauth_connections` table
  - Create `password_reset_tokens` table
  - Add `author_id`, `updated_at`, `published_at`, `is_published` to `articles` table
  - Create `analytics_events` table
  - Create `site_settings` table

- [ ] 1.2 **Update User model**
  - File: `backend/app/models/user.py`
  - Add password_hash field
  - Add is_active, is_verified fields
  - Add updated_at, password_changed_at fields
  - Make oauth_provider/oauth_id nullable
  - Add relationships: oauth_connections, sessions, articles
  - Update role type to include 'user' (align with design)

- [ ] 1.3 **Create Session model**
  - File: `backend/app/models/session.py`
  - Define all columns per design spec
  - Add relationship to User
  - Create indexes

- [ ] 1.4 **Create OAuthConnection model**
  - File: `backend/app/models/oauth_connection.py`
  - Define columns: user_id, provider, provider_user_id, provider_email, provider_metadata
  - Add unique constraint on (provider, provider_user_id)

- [ ] 1.5 **Create PasswordResetToken model**
  - File: `backend/app/models/password_reset_token.py`
  - Define columns: user_id, token_hash, expires_at, used_at

- [ ] 1.6 **Create AnalyticsEvent model**
  - File: `backend/app/models/analytics.py`
  - Define columns: event_type, page, user_id, metadata, ip_address, session_id, timestamp

- [ ] 1.7 **Create SiteSettings model**
  - File: `backend/app/models/settings.py`
  - Define key-value store with description, updated_at, updated_by

- [ ] 1.8 **Update models __init__.py**
  - File: `backend/app/models/__init__.py`
  - Export all new models

### 2. Security Infrastructure

- [ ] 1.9 **Create password hashing module**
  - File: `backend/app/core/security.py`
  - Implement `hash_password()` using Argon2id
  - Implement `verify_password()` 
  - Configure Argon2 parameters (memory: 64MB, iterations: 3, parallelism: 4)

- [ ] 1.10 **Create JWT utilities**
  - File: `backend/app/core/security.py`
  - Implement `create_access_token(user_id, role)`
  - Implement `create_refresh_token(user_id)`
  - Implement `decode_token(token)` with validation
  - Implement `hash_token(token)` for storage
  - Configure: ACCESS_TOKEN_EXPIRE = 15 min, REFRESH_TOKEN_EXPIRE = 7 days

- [ ] 1.11 **Create rate limiting middleware**
  - File: `backend/app/core/rate_limit.py`
  - Implement Redis-based rate limiting
  - Define rate limits: auth=5/min, api=100/min, search=30/min
  - Create `rate_limit()` dependency function

### 3. Authentication Services

- [ ] 1.12 **Create SessionService**
  - File: `backend/app/services/session.py`
  - Implement `create_session(user_id, ip, user_agent)` → returns tokens
  - Implement `validate_session(token_hash)` → returns user
  - Implement `refresh_session(refresh_token_hash)` → returns new access token
  - Implement `invalidate_session(session_id)`
  - Implement `invalidate_all_sessions(user_id)`
  - Implement `get_active_sessions(user_id)`
  - Add Redis caching for session validation

- [ ] 1.13 **Create AuthService**
  - File: `backend/app/services/auth.py`
  - Implement `register(email, password, username)` → creates unverified user
  - Implement `login(email, password)` → validates credentials, creates session
  - Implement `logout(user_id, session_id)` → invalidates session
  - Implement `verify_email(token)` → marks user as verified
  - Implement `request_password_reset(email)` → generates token, sends email
  - Implement `reset_password(token, new_password)` → validates and updates password

- [ ] 1.14 **Create EmailService**
  - File: `backend/app/services/email.py`
  - Implement `send_verification_email(email, token)`
  - Implement `send_password_reset_email(email, token)`
  - Configure SMTP settings in config
  - Create email templates (can use simple HTML templates)

### 4. Authentication API Routes

- [ ] 1.15 **Create auth routes file**
  - File: `backend/app/api/routes/auth.py`
  - Create router with prefix `/auth`

- [ ] 1.16 **Implement POST /api/auth/register**
  - Validate input (email format, password strength)
  - Check email uniqueness
  - Hash password, create user
  - Send verification email
  - Return 201 with user data

- [ ] 1.17 **Implement POST /api/auth/login**
  - Validate credentials
  - Check is_active, is_verified
  - Create session via SessionService
  - Set refresh_token as HTTP-only cookie
  - Return access_token and user data

- [ ] 1.18 **Implement POST /api/auth/logout**
  - Validate access token
  - Invalidate current session
  - Clear refresh token cookie
  - Return success message

- [ ] 1.19 **Implement POST /api/auth/refresh**
  - Read refresh_token from cookie
  - Validate and refresh session
  - Return new access_token
  - Set new refresh_token cookie

- [ ] 1.20 **Implement GET /api/auth/me**
  - Validate access token
  - Return user data with oauth_connections

- [ ] 1.21 **Implement POST /api/auth/password/reset-request**
  - Accept email
  - Generate reset token if user exists
  - Send password reset email
  - Always return success (security: don't reveal if email exists)

- [ ] 1.22 **Implement POST /api/auth/password/reset**
  - Validate reset token
  - Hash and update password
  - Mark token as used
  - Invalidate all sessions for user

- [ ] 1.23 **Implement GET /api/auth/sessions**
  - List all active sessions for current user
  - Mark current session with is_current flag

- [ ] 1.24 **Implement DELETE /api/auth/sessions/{session_id}**
  - Invalidate specific session
  - Prevent invalidating current session (optional: allow with warning)

### 5. API Dependencies & Middleware

- [ ] 1.25 **Create auth dependencies**
  - File: `backend/app/api/deps.py` (modify existing)
  - Implement `get_current_user()` dependency
  - Implement `get_current_active_user()` 
  - Implement `require_roles(*roles)` dependency

- [ ] 1.26 **Create RBAC middleware**
  - File: `backend/app/core/rbac.py`
  - Define PERMISSIONS dict per design
  - Implement `has_permission(role, permission)`
  - Implement `require_permission(permission)` decorator

- [ ] 1.27 **Update API router**
  - File: `backend/app/api/routes/__init__.py` (modify)
  - Include auth router

- [ ] 1.28 **Update config for auth settings**
  - File: `backend/app/core/config.py` (modify)
  - Add SMTP settings (smtp_host, smtp_port, smtp_user, smtp_password, smtp_from)
  - Add frontend_url for email links
  - Add access_token_expire_minutes, refresh_token_expire_days

---

## Phase 2: OAuth Integration

### 1. OAuth Service

- [ ] 2.1 **Create OAuthService**
  - File: `backend/app/services/oauth.py`
  - Implement `get_oauth_url(provider, state)` → returns provider auth URL
  - Implement `exchange_code(provider, code)` → returns provider tokens
  - Implement `get_user_info(provider, access_token)` → returns provider user data
  - Implement `find_or_create_user(provider, provider_user_id, email, name)` → returns User
  - Implement `connect_oauth(user_id, provider, provider_data)` → creates OAuthConnection

### 2. OAuth API Routes

- [ ] 2.2 **Implement GET /api/auth/oauth/{provider}**
  - File: `backend/app/api/routes/auth.py` (add to existing)
  - Generate and store state in Redis (10 min TTL)
  - Redirect to provider OAuth URL
  - Support providers: google, github

- [ ] 2.3 **Implement GET /api/auth/oauth/{provider}/callback**
  - File: `backend/app/api/routes/auth.py` (add to existing)
  - Validate state parameter
  - Exchange code for tokens
  - Get user info from provider
  - Find or create user
  - Create session
  - Redirect to frontend callback page with tokens

- [ ] 2.4 **Implement DELETE /api/auth/oauth/{provider}**
  - Disconnect OAuth provider from current user
  - Prevent disconnecting if no password set

### 3. Configuration

- [ ] 2.5 **Add OAuth provider config**
  - File: `backend/app/core/config.py` (modify)
  - Ensure github_client_id, github_client_secret exist
  - Ensure google_client_id, google_client_secret exist
  - Add oauth_redirect_uri

---

## Phase 3: Authorization & Session Management

### 1. Admin Routes

- [ ] 3.1 **Create admin routes file**
  - File: `backend/app/api/routes/admin.py`
  - Create router with prefix `/admin`
  - Apply require_role("admin") to all routes

- [ ] 3.2 **Implement GET /api/admin/users**
  - List users with pagination
  - Support filters: role, search (email/username)
  - Return user data with is_active, is_verified, last_login

- [ ] 3.3 **Implement GET /api/admin/users/{user_id}**
  - Get single user details
  - Include oauth_connections, session count

- [ ] 3.4 **Implement PATCH /api/admin/users/{user_id}**
  - Update role (user/editor/admin)
  - Update is_active status
  - Prevent self-demotion for last admin

- [ ] 3.5 **Implement DELETE /api/admin/users/{user_id}**
  - Soft delete (set is_active=false)
  - Invalidate all user sessions

- [ ] 3.6 **Implement GET /api/admin/settings**
  - Get all site settings as key-value pairs

- [ ] 3.7 **Implement PATCH /api/admin/settings**
  - Update multiple settings
  - Validate setting keys
  - Update updated_at, updated_by

### 2. Article Management Routes

- [ ] 3.8 **Modify articles routes for authorization**
  - File: `backend/app/api/routes/articles.py` (modify)
  - Add auth requirement to POST, DELETE endpoints
  - Add require_role("editor") to create/edit/delete

- [ ] 3.9 **Create admin article routes**
  - File: `backend/app/api/routes/admin.py` (add to existing)
  - Implement POST /api/admin/articles (create)
  - Implement PATCH /api/admin/articles/{id} (update)
  - Implement DELETE /api/admin/articles/{id} (delete)
  - Set author_id from current user on create

---

## Phase 4: Frontend Authentication

### 1. Auth Context & Hooks

- [ ] 4.1 **Create auth context**
  - File: `app/lib/auth/context.tsx`
  - Define AuthContext with user, isLoading, isAuthenticated
  - Define login, logout, register, refreshToken methods
  - Implement AuthProvider component

- [ ] 4.2 **Create token management**
  - File: `app/lib/auth/tokens.ts`
  - Implement in-memory access token storage
  - Implement auto-refresh scheduling

- [ ] 4.3 **Create auth API client**
  - File: `app/lib/auth/api.ts`
  - Implement login API call
  - Implement register API call
  - Implement logout API call
  - Implement refresh token API call
  - Implement get current user API call

- [ ] 4.4 **Create auth hooks**
  - File: `app/lib/auth/hooks.ts`
  - Export useAuth() hook
  - Export useUser() hook
  - Export usePermissions() hook

### 2. API Client

- [ ] 4.5 **Create base API client**
  - File: `app/lib/api/client.ts`
  - Implement apiFetch with auto-auth
  - Implement auto-refresh on 401
  - Implement convenience methods (get, post, patch, delete)

- [ ] 4.6 **Create article API client**
  - File: `app/lib/api/articles.ts`
  - Implement CRUD operations for articles
  - Include authorization headers

- [ ] 4.7 **Create user API client**
  - File: `app/lib/api/users.ts`
  - Implement user management operations

### 3. Auth Components

- [ ] 4.8 **Create ProtectedRoute component**
  - File: `app/components/auth/ProtectedRoute.tsx`
  - Check authentication status
  - Support requiredRole prop
  - Redirect to login if unauthenticated

- [ ] 4.9 **Create LoginForm component**
  - File: `app/components/auth/LoginForm.tsx`
  - Email/password form
  - Validation and error display
  - OAuth buttons

- [ ] 4.10 **Create RegisterForm component**
  - File: `app/components/auth/RegisterForm.tsx`
  - Email/password/username form
  - Password strength validation
  - Terms acceptance checkbox

- [ ] 4.11 **Create OAuthButtons component**
  - File: `app/components/auth/OAuthButtons.tsx`
  - Google login button
  - GitHub login button
  - Handle redirect to OAuth flow

### 4. Auth Pages

- [ ] 4.12 **Create login page**
  - File: `app/(auth)/login/page.tsx`
  - Use LoginForm component
  - Handle redirect after login
  - Show registration link

- [ ] 4.13 **Create register page**
  - File: `app/(auth)/register/page.tsx`
  - Use RegisterForm component
  - Show success message and login link

- [ ] 4.14 **Create forgot password page**
  - File: `app/(auth)/forgot-password/page.tsx`
  - Email input form
  - Show success message

- [ ] 4.15 **Create reset password page**
  - File: `app/(auth)/reset-password/page.tsx`
  - Password reset form with token from URL
  - Password strength validation
  - Redirect to login on success

- [ ] 4.16 **Create OAuth callback page**
  - File: `app/(auth)/callback/page.tsx`
  - Handle OAuth callback
  - Extract tokens from URL
  - Store tokens and redirect to dashboard

- [ ] 4.17 **Update root layout**
  - File: `app/layout.tsx` (modify)
  - Wrap with AuthProvider
  - Handle loading state

---

## Phase 5: Admin Dashboard Frontend

### 1. Dashboard Layout

- [ ] 5.1 **Create dashboard layout**
  - File: `app/(dashboard)/layout.tsx`
  - Wrap with ProtectedRoute
  - Include dashboard sidebar
  - Include header with user menu

- [ ] 5.2 **Create dashboard sidebar**
  - File: `app/components/dashboard/Sidebar.tsx`
  - Navigation links based on role
  - User info display
  - Logout button

- [ ] 5.3 **Create dashboard header**
  - File: `app/components/dashboard/Header.tsx`
  - User dropdown menu
  - Notifications (placeholder)
  - Theme toggle

- [ ] 5.4 **Create dashboard home page**
  - File: `app/(dashboard)/page.tsx`
  - Welcome message
  - Quick stats (articles count, users count)
  - Recent activity placeholder

### 2. User Management

- [ ] 5.5 **Create user list page**
  - File: `app/(dashboard)/users/page.tsx`
  - Table with users
  - Pagination
  - Search and filter
  - Role badges
  - Actions (edit, deactivate)

- [ ] 5.6 **Create UserList component**
  - File: `app/components/users/UserList.tsx`
  - Data table with sorting
  - Action buttons per row

- [ ] 5.7 **Create UserForm component**
  - File: `app/components/users/UserForm.tsx`
  - Role selector dropdown
  - Active status toggle
  - Save/cancel buttons

- [ ] 5.8 **Create RoleSelector component**
  - File: `app/components/users/RoleSelector.tsx`
  - Dropdown with role options
  - Display current role

### 3. Article Management

- [ ] 5.9 **Create article list page**
  - File: `app/(dashboard)/articles/page.tsx`
  - Table with articles
  - Search and filter by category
  - Create new button

- [ ] 5.10 **Create new article page**
  - File: `app/(dashboard)/articles/new/page.tsx`
  - Use ArticleEditor component
  - Handle form submission

- [ ] 5.11 **Create edit article page**
  - File: `app/(dashboard)/articles/[id]/edit/page.tsx`
  - Load existing article
  - Use ArticleEditor component

- [ ] 5.12 **Create ArticleEditor component**
  - File: `app/components/articles/ArticleEditor.tsx`
  - Title, slug, category inputs
  - Markdown editor with preview
  - Frontmatter editor (JSON)
  - Publish/draft toggle
  - Save button

- [ ] 5.13 **Create ArticleForm component**
  - File: `app/components/articles/ArticleForm.tsx`
  - Form validation
  - Category selector
  - Submit handling

### 4. Settings Page

- [ ] 5.14 **Create settings page**
  - File: `app/(dashboard)/settings/page.tsx`
  - Settings form
  - Save button
  - Display current values

---

## Phase 6: Testing & Polish

### 1. Backend Testing

- [ ] 6.1 **Create auth service tests**
  - File: `backend/tests/test_auth_service.py`
  - Test registration flow
  - Test login flow
  - Test token refresh
  - Test password reset

- [ ] 6.2 **Create auth API tests**
  - File: `backend/tests/test_auth_routes.py`
  - Test all auth endpoints
  - Test error responses
  - Test rate limiting

- [ ] 6.3 **Create admin API tests**
  - File: `backend/tests/test_admin_routes.py`
  - Test user management
  - Test authorization checks
  - Test settings management

### 2. Frontend Testing

- [ ] 6.4 **Test auth flow manually**
  - Register new user
  - Login with email/password
  - Access protected routes
  - Logout and verify redirect

- [ ] 6.5 **Test OAuth flow manually**
  - GitHub OAuth login
  - Google OAuth login
  - Verify user creation
  - Verify session creation

### 3. Security Hardening

- [ ] 6.6 **Add audit logging**
  - File: `backend/app/core/audit.py`
  - Log all auth events
  - Log role changes
  - Log settings changes

- [ ] 6.7 **Add security headers middleware**
  - File: `backend/app/main.py` (modify)
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Strict-Transport-Security

- [ ] 6.8 **Verify rate limiting**
  - Test rate limits work correctly
  - Test 429 responses

- [ ] 6.9 **Security checklist review**
  - Password hashing working
  - JWT validation working
  - CORS properly configured
  - Cookies have correct attributes (HttpOnly, Secure, SameSite)

### 4. Documentation

- [ ] 6.10 **Update AGENTS.md**
  - Add auth-related commands
  - Update API endpoints list
  - Add new environment variables

- [ ] 6.11 **Create admin user guide**
  - File: `docs/ADMIN_GUIDE.md`
  - How to manage users
  - How to create/edit articles
  - How to configure settings

---

## Files Summary

### Backend Files to Create

| File | Description |
|------|-------------|
| `backend/alembic/versions/002_auth_system.py` | Database migration |
| `backend/app/models/session.py` | Session model |
| `backend/app/models/oauth_connection.py` | OAuth connection model |
| `backend/app/models/password_reset_token.py` | Password reset token model |
| `backend/app/models/analytics.py` | Analytics event model |
| `backend/app/models/settings.py` | Site settings model |
| `backend/app/core/security.py` | Password hashing, JWT utilities |
| `backend/app/core/rate_limit.py` | Rate limiting middleware |
| `backend/app/core/rbac.py` | Role-based access control |
| `backend/app/core/audit.py` | Audit logging |
| `backend/app/services/auth.py` | Authentication service |
| `backend/app/services/session.py` | Session management service |
| `backend/app/services/oauth.py` | OAuth integration service |
| `backend/app/services/email.py` | Email sending service |
| `backend/app/api/routes/auth.py` | Authentication API endpoints |
| `backend/app/api/routes/admin.py` | Admin API endpoints |
| `backend/tests/test_auth_service.py` | Auth service tests |
| `backend/tests/test_auth_routes.py` | Auth routes tests |
| `backend/tests/test_admin_routes.py` | Admin routes tests |

### Backend Files to Modify

| File | Changes |
|------|---------|
| `backend/app/models/user.py` | Add auth fields, relationships |
| `backend/app/models/article.py` | Add author_id, timestamps |
| `backend/app/models/__init__.py` | Export new models |
| `backend/app/api/deps.py` | Add auth dependencies |
| `backend/app/api/routes/__init__.py` | Include auth, admin routers |
| `backend/app/api/routes/articles.py` | Add auth requirements |
| `backend/app/core/config.py` | Add auth-related settings |
| `backend/app/main.py` | Add security headers, audit logging |
| `backend/alembic/env.py` | Import new models |

### Frontend Files to Create

| File | Description |
|------|-------------|
| `app/lib/auth/context.tsx` | Auth context provider |
| `app/lib/auth/hooks.ts` | Auth hooks |
| `app/lib/auth/tokens.ts` | Token management |
| `app/lib/auth/api.ts` | Auth API client |
| `app/lib/api/client.ts` | Base API client |
| `app/lib/api/articles.ts` | Article API client |
| `app/lib/api/users.ts` | User API client |
| `app/(auth)/login/page.tsx` | Login page |
| `app/(auth)/register/page.tsx` | Registration page |
| `app/(auth)/forgot-password/page.tsx` | Password reset request |
| `app/(auth)/reset-password/page.tsx` | Password reset form |
| `app/(auth)/callback/page.tsx` | OAuth callback |
| `app/(dashboard)/layout.tsx` | Dashboard layout |
| `app/(dashboard)/page.tsx` | Dashboard home |
| `app/(dashboard)/articles/page.tsx` | Article list |
| `app/(dashboard)/articles/new/page.tsx` | Create article |
| `app/(dashboard)/articles/[id]/edit/page.tsx` | Edit article |
| `app/(dashboard)/users/page.tsx` | User management |
| `app/(dashboard)/settings/page.tsx` | Site settings |
| `app/components/auth/AuthProvider.tsx` | Auth context wrapper |
| `app/components/auth/ProtectedRoute.tsx` | Route protection |
| `app/components/auth/LoginForm.tsx` | Login form |
| `app/components/auth/RegisterForm.tsx` | Registration form |
| `app/components/auth/OAuthButtons.tsx` | OAuth login buttons |
| `app/components/dashboard/Sidebar.tsx` | Dashboard sidebar |
| `app/components/dashboard/Header.tsx` | Dashboard header |
| `app/components/articles/ArticleEditor.tsx` | Markdown editor |
| `app/components/articles/ArticleForm.tsx` | Article form |
| `app/components/articles/ArticleList.tsx` | Article list component |
| `app/components/users/UserList.tsx` | User list component |
| `app/components/users/UserForm.tsx` | User edit form |
| `app/components/users/RoleSelector.tsx` | Role dropdown |

### Frontend Files to Modify

| File | Changes |
|------|---------|
| `app/layout.tsx` | Wrap with AuthProvider |

---

## Success Criteria

- [ ] Users can register with email/password
- [ ] Users receive verification email
- [ ] Users can login with email/password
- [ ] Access tokens expire after 15 minutes
- [ ] Refresh tokens work correctly (HTTP-only cookie)
- [ ] Users can login via Google OAuth
- [ ] Users can login via GitHub OAuth
- [ ] Sessions are tracked in database and Redis
- [ ] Users can view and invalidate their sessions
- [ ] Password reset flow works end-to-end
- [ ] Admin can view all users
- [ ] Admin can change user roles
- [ ] Admin can deactivate users
- [ ] Editors can create articles
- [ ] Editors can edit articles
- [ ] Editors can delete articles
- [ ] Admin can manage site settings
- [ ] Rate limiting prevents brute force attacks
- [ ] All auth operations are audit logged
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based access control enforced
