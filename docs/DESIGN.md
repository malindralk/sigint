# Authentication, Authorization, Session Management & Admin Dashboard - Design Document

## Overview

This document outlines the design for a comprehensive authentication and authorization system for the SIGINT Wiki platform, along with an admin dashboard for content and user management.

### Key Decisions
- **OAuth Flow**: Backend redirect flow with secure state parameter
- **Frontend Auth**: Client-side authentication with static export compatibility
- **Token Storage**: Access tokens in memory, refresh tokens in HTTP-only cookies
- **MVP Scope**: Authentication + User Management + Article Management (analytics deferred)

---

## 1. Architecture Overview

### 1.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js Static Export)                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│   │   Public     │   │   Auth       │   │   Admin      │   │   Admin      │    │
│   │   Pages      │   │   Pages      │   │   Dashboard  │   │   Article    │    │
│   │   (Static)   │   │   (CSR)      │   │   (CSR)      │   │   Editor     │    │
│   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘    │
│          │                  │                  │                  │              │
│          └──────────────────┴──────────────────┴──────────────────┘              │
│                                    │                                             │
│                        ┌───────────┴───────────┐                                │
│                        │   Auth Context        │                                │
│                        │   (React Context)     │                                │
│                        │   - Access Token      │                                │
│                        │   - User State        │                                │
│                        │   - Auth Methods      │                                │
│                        └───────────┬───────────┘                                │
│                                    │                                             │
└────────────────────────────────────┼─────────────────────────────────────────────┘
                                     │ HTTP/HTTPS
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (FastAPI)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│   │   Auth       │   │   Users      │   │   Articles   │   │   Admin      │    │
│   │   Routes     │   │   Routes     │   │   Routes     │   │   Routes     │    │
│   │              │   │              │   │              │   │              │    │
│   │ /auth/*      │   │ /users/*     │   │ /articles/*  │   │ /admin/*     │    │
│   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘    │
│          │                  │                  │                  │              │
│          └──────────────────┴──────────────────┴──────────────────┘              │
│                                    │                                             │
│                        ┌───────────┴───────────┐                                │
│                        │   Auth Middleware     │                                │
│                        │   - JWT Validation    │                                │
│                        │   - RBAC Checks       │                                │
│                        │   - Rate Limiting     │                                │
│                        └───────────┬───────────┘                                │
│                                    │                                             │
│                        ┌───────────┴───────────┐                                │
│                        │   Services            │                                │
│                        │   - AuthService       │                                │
│                        │   - UserService       │                                │
│                        │   - SessionService    │                                │
│                        │   - ArticleService    │                                │
│                        └───────────┬───────────┘                                │
│                                    │                                             │
└────────────────────────────────────┼─────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
           ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
           │  PostgreSQL  │  │    Redis     │  │   Email      │
           │  (pgvector)  │  │   (Cache &   │  │   Service    │
           │              │  │   Sessions)  │  │   (SMTP)     │
           └──────────────┘  └──────────────┘  └──────────────┘
```

### 1.2 Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Email/Password Login:                                           │
│  Client → POST /auth/login → AuthService → JWT + Session         │
│                                                                  │
│  OAuth Login:                                                    │
│  Client → GET /auth/oauth/{provider} → OAuth Provider            │
│  OAuth Provider → GET /auth/oauth/{provider}/callback            │
│  Callback Handler → AuthService → JWT + Session → Redirect       │
│                                                                  │
│  Token Refresh:                                                  │
│  Client (cookie) → POST /auth/refresh → SessionService → New JWT │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Authorization Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request → AuthMiddleware (JWT validation)                       │
│          → RBACMiddleware (role/permission check)                │
│          → Route Handler → Response                              │
│                                                                  │
│  Role Hierarchy:                                                 │
│  admin > editor > user                                           │
│                                                                  │
│  Permission Inheritance:                                         │
│  admin: All permissions                                          │
│  editor: article:create, article:edit, article:delete            │
│  user: article:read (public content only)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────────┐
│       users         │       │   oauth_connections     │
├─────────────────────┤       ├─────────────────────────┤
│ id (PK)             │◄──────│ user_id (FK)            │
│ email (unique)      │       │ id (PK)                 │
│ password_hash       │       │ provider                │
│ username            │       │ provider_user_id        │
│ avatar_url          │       │ provider_email          │
│ role                │       │ provider_metadata       │
│ is_active           │       │ created_at              │
│ is_verified         │       └─────────────────────────┘
│ created_at          │
│ updated_at          │       ┌─────────────────────────┐
│ last_login          │       │       sessions          │
│ password_changed_at │       ├─────────────────────────┤
└─────────────────────┘       │ id (PK)                 │
         │                    │ user_id (FK)            │
         │                    │ token_hash              │
         │                    │ refresh_token_hash      │
         │                    │ ip_address              │
         │                    │ user_agent              │
         │                    │ expires_at              │
         │                    │ created_at              │
         │                    │ last_activity           │
         │                    └─────────────────────────┘
         │
         │                    ┌─────────────────────────┐
         │                    │   password_reset_tokens │
         │                    ├─────────────────────────┤
         │                    │ id (PK)                 │
         │                    │ user_id (FK)            │
         │                    │ token_hash              │
         │                    │ expires_at              │
         │                    │ used_at                 │
         │                    │ created_at              │
         │                    └─────────────────────────┘
         │
         ▼
┌─────────────────────┐       ┌─────────────────────────┐
│      articles       │       │   analytics_events      │
├─────────────────────┤       ├─────────────────────────┤
│ id (PK)             │       │ id (PK)                 │
│ slug (unique)       │       │ event_type              │
│ category            │       │ page                    │
│ title               │       │ user_id (FK, nullable)  │
│ description         │       │ metadata                │
│ content             │       │ ip_address              │
│ frontmatter         │       │ timestamp               │
│ author_id (FK)      │──────►│ session_id              │
│ git_sha             │       └─────────────────────────┘
│ file_path           │
│ synced_at           │       ┌─────────────────────────┐
│ created_at          │       │      site_settings      │
│ updated_at          │       ├─────────────────────────┤
└─────────────────────┘       │ key (PK)                │
                              │ value                   │
                              │ description             │
                              │ updated_at              │
                              │ updated_by (FK)         │
                              └─────────────────────────┘
```

### 2.2 Detailed Table Definitions

#### 2.2.1 users (Modified)

The existing `users` table needs to be modified to support email/password authentication.

```sql
-- Migration: Modify users table
ALTER TABLE users 
  ADD COLUMN password_hash VARCHAR(255) NULL,
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE NULL;

-- Make oauth_provider and oauth_id nullable (for email-only users)
ALTER TABLE users 
  ALTER COLUMN oauth_provider DROP NOT NULL,
  ALTER COLUMN oauth_id DROP NOT NULL;

-- Add unique constraint on email
CREATE UNIQUE INDEX ix_users_email ON users(email) WHERE email IS NOT NULL;

-- Update role default to 'user' (aligning naming)
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
```

**SQLAlchemy Model:**
```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    
    # Email/Password authentication
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    username: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Legacy OAuth fields (nullable for email-only users)
    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
    # Status fields
    role: Mapped[str] = mapped_column(String(20), default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    oauth_connections: Mapped[list["OAuthConnection"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    sessions: Mapped[list["Session"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    articles: Mapped[list["Article"]] = relationship(back_populates="author")

    Role = Literal["user", "editor", "admin"]

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    @property
    def is_editor(self) -> bool:
        return self.role in ("editor", "admin")
```

#### 2.2.2 oauth_connections (New)

Separate table for multiple OAuth connections per user.

```sql
CREATE TABLE oauth_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),
    provider_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX ix_oauth_connections_user ON oauth_connections(user_id);
CREATE INDEX ix_oauth_connections_provider ON oauth_connections(provider, provider_user_id);
```

**SQLAlchemy Model:**
```python
class OAuthConnection(Base):
    __tablename__ = "oauth_connections"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    provider_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_metadata: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="oauth_connections")

    __table_args__ = (
        UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_user"),
    )
```

#### 2.2.3 sessions (New)

Redis-backed session tracking with database persistence for audit.

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    refresh_token_hash VARCHAR(64) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_sessions_user ON sessions(user_id);
CREATE INDEX ix_sessions_token ON sessions(token_hash);
CREATE INDEX ix_sessions_expires ON sessions(expires_at);
```

**SQLAlchemy Model:**
```python
class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    refresh_token_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    last_activity: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="sessions")
```

#### 2.2.4 password_reset_tokens (New)

```sql
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX ix_password_reset_tokens_hash ON password_reset_tokens(token_hash);
```

#### 2.2.5 articles (Modified)

Add author tracking to articles.

```sql
ALTER TABLE articles 
  ADD COLUMN author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN published_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN is_published BOOLEAN DEFAULT true;

CREATE INDEX ix_articles_author ON articles(author_id);
```

#### 2.2.6 analytics_events (New)

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    page VARCHAR(500) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    session_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX ix_analytics_events_type ON analytics_events(event_type);
CREATE INDEX ix_analytics_events_user ON analytics_events(user_id);
CREATE INDEX ix_analytics_events_timestamp ON analytics_events(timestamp);
```

#### 2.2.7 site_settings (New)

```sql
CREATE TABLE site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);
```

### 2.3 Redis Schema

Redis will be used for session caching and rate limiting.

```
# Session cache (TTL: access token lifetime)
session:{token_hash} -> JSON.stringify({user_id, role, permissions})

# Refresh token blacklist (TTL: refresh token lifetime)
blacklist:{refresh_token_hash} -> "revoked"

# Rate limiting
ratelimit:{ip_address}:{endpoint} -> count (TTL: 60s)

# OAuth state storage (TTL: 10 minutes)
oauth_state:{state} -> JSON.stringify({redirect_uri, provider})
```

---

## 3. API Specifications

### 3.1 Authentication Endpoints

#### POST /api/auth/register
Register a new user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "username": "johndoe"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe"
  }
}
```

**Errors:**
- `400` - Validation error (weak password, invalid email)
- `409` - Email already registered

---

#### POST /api/auth/login
Authenticate with email/password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "role": "user",
    "avatar_url": null
  }
}
```
*Note: Refresh token is set as HTTP-only cookie.*

**Errors:**
- `401` - Invalid credentials
- `403` - Account not verified / Account disabled

---

#### POST /api/auth/logout
Invalidate current session.

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### POST /api/auth/refresh
Refresh access token using refresh token cookie.

**Cookies:** `refresh_token={refresh_token}`

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Errors:**
- `401` - Invalid/expired refresh token

---

#### GET /api/auth/oauth/{provider}
Initiate OAuth flow. Supported providers: `google`, `github`.

**Response (302):**
Redirects to OAuth provider authorization URL.

---

#### GET /api/auth/oauth/{provider}/callback
Handle OAuth provider callback.

**Query Parameters:**
- `code` - Authorization code from provider
- `state` - State parameter for CSRF protection

**Response (302):**
Redirects to frontend with tokens:
- On success: `/auth/callback?success=true`
- On error: `/auth/callback?error={error_message}`

---

#### POST /api/auth/password/reset-request
Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a reset link has been sent."
}
```

---

#### POST /api/auth/password/reset
Reset password using token.

**Request:**
```json
{
  "token": "reset-token-from-email",
  "new_password": "NewSecureP@ss456"
}
```

**Response (200):**
```json
{
  "message": "Password reset successful. Please login with your new password."
}
```

---

#### GET /api/auth/me
Get current authenticated user.

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "role": "user",
  "avatar_url": null,
  "is_verified": true,
  "created_at": "2024-04-16T10:00:00Z",
  "oauth_connections": [
    {
      "provider": "github",
      "provider_email": "user@example.com"
    }
  ]
}
```

---

#### GET /api/auth/sessions
List active sessions for current user.

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-04-16T10:00:00Z",
      "last_activity": "2024-04-16T12:00:00Z",
      "is_current": true
    }
  ]
}
```

---

#### DELETE /api/auth/sessions/{session_id}
Invalidate a specific session.

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "message": "Session invalidated"
}
```

---

### 3.2 User Management Endpoints (Admin Only)

#### GET /api/admin/users
List all users with pagination.

**Headers:** `Authorization: Bearer {access_token}` (requires admin role)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `role` (optional filter)
- `search` (optional search by email/username)

**Response (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "user",
      "is_active": true,
      "is_verified": true,
      "created_at": "2024-04-16T10:00:00Z",
      "last_login": "2024-04-16T12:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

#### PATCH /api/admin/users/{user_id}
Update user role or status.

**Headers:** `Authorization: Bearer {access_token}` (requires admin role)

**Request:**
```json
{
  "role": "editor",
  "is_active": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "editor",
  "is_active": true
}
```

---

#### DELETE /api/admin/users/{user_id}
Delete a user (soft delete by setting is_active=false).

**Headers:** `Authorization: Bearer {access_token}` (requires admin role)

**Response (200):**
```json
{
  "message": "User deactivated"
}
```

---

### 3.3 Article Management Endpoints

#### POST /api/admin/articles
Create a new article (editor/admin only).

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "slug": "new-article-slug",
  "category": "em-sca",
  "title": "New Article Title",
  "description": "Article description",
  "content": "# Article content in markdown\n\n...",
  "frontmatter": {},
  "is_published": false
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "slug": "new-article-slug",
  "category": "em-sca",
  "title": "New Article Title",
  "author_id": "uuid",
  "created_at": "2024-04-16T10:00:00Z"
}
```

---

#### PATCH /api/admin/articles/{article_id}
Update an existing article (editor/admin only).

**Headers:** `Authorization: Bearer {access_token}`

**Request:**
```json
{
  "title": "Updated Title",
  "content": "Updated content...",
  "is_published": true
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "slug": "article-slug",
  "title": "Updated Title",
  "updated_at": "2024-04-16T12:00:00Z"
}
```

---

#### DELETE /api/admin/articles/{article_id}
Delete an article (editor/admin only).

**Headers:** `Authorization: Bearer {access_token}`

**Response (200):**
```json
{
  "message": "Article deleted"
}
```

---

### 3.4 Site Settings Endpoints (Admin Only)

#### GET /api/admin/settings
Get all site settings.

**Headers:** `Authorization: Bearer {access_token}` (requires admin role)

**Response (200):**
```json
{
  "settings": {
    "site_name": "SIGINT Wiki",
    "site_description": "Knowledge base...",
    "maintenance_mode": false,
    "allow_registration": true,
    "default_article_category": "em-sca"
  }
}
```

---

#### PATCH /api/admin/settings
Update site settings.

**Headers:** `Authorization: Bearer {access_token}` (requires admin role)

**Request:**
```json
{
  "maintenance_mode": true,
  "allow_registration": false
}
```

**Response (200):**
```json
{
  "message": "Settings updated",
  "settings": { ... }
}
```

---

## 4. Authentication Flow

### 4.1 Email/Password Registration Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Backend │     │ Database │     │  Redis   │     │   SMTP   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ POST /register │                │                │                │
     │ {email,pwd}    │                │                │                │
     │───────────────►│                │                │                │
     │                │                │                │                │
     │                │ Check existing │                │                │
     │                │───────────────►│                │                │
     │                │                │                │                │
     │                │ Hash password  │                │                │
     │                │ (argon2)       │                │                │
     │                │                │                │                │
     │                │ Create user    │                │                │
     │                │───────────────►│                │                │
     │                │                │                │                │
     │                │ Generate verify│                │                │
     │                │ token          │                │                │
     │                │                │                │                │
     │                │ Send email     │                │                │
     │                │────────────────────────────────────────────────►│
     │                │                │                │                │
     │ 201 Created    │                │                │                │
     │ {user}         │                │                │                │
     │◄───────────────│                │                │                │
     │                │                │                │                │
```

### 4.2 Email/Password Login Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Backend │     │ Database │     │  Redis   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ POST /login    │                │                │
     │ {email,pwd}    │                │                │
     │───────────────►│                │                │
     │                │                │                │
     │                │ Find user      │                │
     │                │───────────────►│                │
     │                │◄───────────────│                │
     │                │                │                │
     │                │ Verify password│                │
     │                │ (argon2)       │                │
     │                │                │                │
     │                │ Generate JWT   │                │
     │                │ + Refresh Token│                │
     │                │                │                │
     │                │ Create session │                │
     │                │───────────────►│                │
     │                │                │                │
     │                │ Cache session  │                │
     │                │───────────────────────────────►│
     │                │                │                │
     │ 200 OK         │                │                │
     │ {access_token} │                │                │
     │ Set-Cookie:    │                │                │
     │ refresh_token  │                │                │
     │◄───────────────│                │                │
     │                │                │                │
```

### 4.3 OAuth Flow (Backend Redirect)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Backend │     │  Redis   │     │  OAuth   │     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ GET /oauth/    │                │                │                │
     │ {provider}     │                │                │                │
     │───────────────►│                │                │                │
     │                │                │                │                │
     │                │ Generate state │                │                │
     │                │ Store in Redis │                │                │
     │                │───────────────►│                │                │
     │                │                │                │                │
     │ 302 Redirect   │                │                │                │
     │ to OAuth URL   │                │                │                │
     │◄───────────────│                │                │                │
     │                │                │                │                │
     │ Authorization  │                │                │                │
     │ Request        │                │                │                │
     │────────────────────────────────────────────────►│                │
     │                │                │                │                │
     │ Redirect with  │                │                │                │
     │ code + state   │                │                │                │
     │◄───────────────────────────────────────────────│                │
     │                │                │                │                │
     │ GET /oauth/    │                │                │                │
     │ {provider}/    │                │                │                │
     │ callback?code& │                │                │                │
     │ state          │                │                │                │
     │───────────────►│                │                │                │
     │                │                │                │                │
     │                │ Verify state   │                │                │
     │                │───────────────►│                │                │
     │                │◄───────────────│                │                │
     │                │                │                │                │
     │                │ Exchange code  │                │                │
     │                │ for token      │                │                │
     │                │───────────────────────────────►│                │
     │                │◄───────────────────────────────│                │
     │                │                │                │                │
     │                │ Get user info  │                │                │
     │                │───────────────────────────────►│                │
     │                │◄───────────────────────────────│                │
     │                │                │                │                │
     │                │ Find/create    │                │                │
     │                │ user           │                │                │
     │                │───────────────────────────────────────────────►│
     │                │◄──────────────────────────────────────────────│
     │                │                │                │                │
     │                │ Generate JWT   │                │                │
     │                │ + Session      │                │                │
     │                │                │                │                │
     │ 302 Redirect   │                │                │                │
     │ to /auth/      │                │                │                │
     │ callback       │                │                │                │
     │ Set-Cookie     │                │                │                │
     │◄───────────────│                │                │                │
     │                │                │                │                │
```

### 4.4 Token Refresh Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │  Backend │     │  Redis   │     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ POST /refresh  │                │                │
     │ Cookie:        │                │                │
     │ refresh_token  │                │                │
     │───────────────►│                │                │
     │                │                │                │
     │                │ Check blacklist│                │
     │                │───────────────►│                │
     │                │◄───────────────│                │
     │                │                │                │
     │                │ Find session   │                │
     │                │ by token hash  │                │
     │                │───────────────────────────────►│
     │                │◄──────────────────────────────│
     │                │                │                │
     │                │ Verify not     │                │
     │                │ expired        │                │
     │                │                │                │
     │                │ Generate new   │                │
     │                │ access token   │                │
     │                │                │                │
     │                │ Update session │                │
     │                │ last_activity  │                │
     │                │───────────────────────────────►│
     │                │                │                │
     │ 200 OK         │                │                │
     │ {access_token} │                │                │
     │◄───────────────│                │                │
     │                │                │                │
```

---

## 5. Authorization Rules

### 5.1 Role-Based Access Control (RBAC)

#### Role Hierarchy

```
admin ─────► editor ─────► user
  │             │            │
  │             │            └── Read public content
  │             │
  │             └── Create, edit, delete articles
  │
  └── Full access to everything
```

#### Permission Matrix

| Permission | User | Editor | Admin |
|------------|------|--------|-------|
| `article:read` | ✅ Public only | ✅ All | ✅ All |
| `article:create` | ❌ | ✅ | ✅ |
| `article:edit` | ❌ | ✅ Own + All | ✅ All |
| `article:delete` | ❌ | ✅ Own | ✅ All |
| `user:read` | ❌ | ❌ | ✅ |
| `user:update` | ❌ | ❌ | ✅ |
| `user:delete` | ❌ | ❌ | ✅ |
| `settings:read` | ❌ | ❌ | ✅ |
| `settings:update` | ❌ | ❌ | ✅ |
| `analytics:view` | ❌ | ❌ | ✅ |

### 5.2 Middleware Implementation

```python
from functools import wraps
from fastapi import HTTPException, Depends
from app.api.deps import get_current_user

def require_role(*roles: str):
    """Decorator to require specific roles."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, user=Depends(get_current_user), **kwargs):
            if user.role not in roles:
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions"
                )
            return await func(*args, user=user, **kwargs)
        return wrapper
    return decorator

def require_permission(permission: str):
    """Decorator to require specific permission."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, user=Depends(get_current_user), **kwargs):
            if not has_permission(user.role, permission):
                raise HTTPException(
                    status_code=403,
                    detail="Insufficient permissions"
                )
            return await func(*args, user=user, **kwargs)
        return wrapper
    return decorator

# Permission definitions
PERMISSIONS = {
    "user": ["article:read"],
    "editor": ["article:read", "article:create", "article:edit", "article:delete"],
    "admin": ["*"]  # All permissions
}

def has_permission(role: str, permission: str) -> bool:
    role_permissions = PERMISSIONS.get(role, [])
    return "*" in role_permissions or permission in role_permissions
```

---

## 6. Frontend Architecture

### 6.1 Component Structure

```
app/
├── (public)/                    # Public routes (static)
│   ├── page.tsx                 # Home page
│   ├── [category]/              # Category pages
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   └── ...
│
├── (auth)/                      # Auth routes (client-side)
│   ├── login/page.tsx           # Login page
│   ├── register/page.tsx        # Registration page
│   ├── forgot-password/page.tsx # Password reset request
│   ├── reset-password/page.tsx  # Password reset form
│   └── callback/page.tsx        # OAuth callback handler
│
├── (dashboard)/                 # Protected routes (client-side)
│   ├── layout.tsx               # Dashboard layout with auth check
│   ├── page.tsx                 # Dashboard home
│   ├── articles/
│   │   ├── page.tsx             # Article list
│   │   ├── new/page.tsx         # Create article
│   │   └── [id]/edit/page.tsx   # Edit article
│   ├── users/
│   │   ├── page.tsx             # User list (admin)
│   │   └── [id]/page.tsx        # User details
│   └── settings/
│       └── page.tsx             # Site settings (admin)
│
├── components/
│   ├── auth/
│   │   ├── AuthProvider.tsx     # React Context for auth state
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── OAuthButtons.tsx
│   │   └── ProtectedRoute.tsx
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Navigation.tsx
│   ├── articles/
│   │   ├── ArticleEditor.tsx    # Markdown editor
│   │   ├── ArticleList.tsx
│   │   └── ArticleForm.tsx
│   └── users/
│       ├── UserList.tsx
│       ├── UserForm.tsx
│       └── RoleSelector.tsx
│
├── lib/
│   ├── auth/
│   │   ├── context.tsx          # Auth context definition
│   │   ├── hooks.ts             # useAuth, useUser hooks
│   │   ├── tokens.ts            # Token management utilities
│   │   └── api.ts               # Auth API client
│   └── api/
│       ├── client.ts            # Base API client with auth
│       ├── articles.ts          # Article API
│       └── users.ts             # User API
│
└── hooks/
    └── use-auth.ts              # Main auth hook
```

### 6.2 Auth Context Implementation

```typescript
// lib/auth/context.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string | null;
  role: 'user' | 'editor' | 'admin';
  avatarUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  async function initializeAuth() {
    try {
      // Try to refresh token on page load
      await refreshToken();
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshToken() {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Include refresh token cookie
    });

    if (response.ok) {
      const data = await response.json();
      setAccessToken(data.access_token);
      await fetchUser(data.access_token);
    } else {
      throw new Error('Token refresh failed');
    }
  }

  async function fetchUser(token: string) {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      const userData = await response.json();
      setUser(userData);
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    setAccessToken(data.access_token);
    setUser(data.user);
  }

  async function logout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    });
    setUser(null);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshToken,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### 6.3 Protected Route Implementation

```typescript
// components/auth/ProtectedRoute.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'editor' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRole) {
      const roleHierarchy = { user: 0, editor: 1, admin: 2 };
      if (roleHierarchy[user?.role || 'user'] < roleHierarchy[requiredRole]) {
        router.push('/dashboard?error=insufficient_permissions');
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, user, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

### 6.4 Token Management

```typescript
// lib/auth/tokens.ts

// Access token is stored in memory (not localStorage for security)
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

// Refresh token is automatically sent via HTTP-only cookie
// No client-side storage needed

// Auto-refresh token before expiry
export function setupTokenRefresh(expiresIn: number, refreshFn: () => Promise<void>) {
  // Refresh 5 minutes before expiry
  const refreshTime = (expiresIn - 300) * 1000;
  
  return setTimeout(() => {
    refreshFn().catch(console.error);
  }, refreshTime);
}
```

### 6.5 API Client with Auth

```typescript
// lib/api/client.ts

import { getAccessToken, setAccessToken } from '@/lib/auth/tokens';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function refreshAccessToken(): Promise<string | null> {
  const response = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (response.ok) {
    const data = await response.json();
    setAccessToken(data.access_token);
    return data.access_token;
  }
  
  setAccessToken(null);
  return null;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  headers.set('Content-Type', 'application/json');
  
  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });
  
  // Auto-refresh on 401
  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include',
      });
    }
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }
  
  return response.json();
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data: unknown, options?: RequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  patch: <T>(endpoint: string, data: unknown, options?: RequestOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
```

---

## 7. Security Considerations

### 7.1 Password Security

- **Hashing Algorithm**: Argon2id (preferred) or bcrypt
- **Argon2 Parameters**:
  - Memory: 64 MB
  - Iterations: 3
  - Parallelism: 4
  - Salt length: 16 bytes
  - Hash length: 32 bytes

```python
from argon2 import PasswordHasher

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16
)

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(hash: str, password: str) -> bool:
    try:
        ph.verify(hash, password)
        return True
    except:
        return False
```

### 7.2 JWT Configuration

```python
from datetime import timedelta

# JWT Settings
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(minutes=15)
REFRESH_TOKEN_EXPIRE = timedelta(days=7)

# Token structure
{
  "sub": "user_id",
  "role": "user|editor|admin",
  "exp": timestamp,
  "iat": timestamp,
  "jti": "unique_token_id"
}
```

### 7.3 Rate Limiting

```python
from fastapi import Request, HTTPException
from functools import wraps
import redis.asyncio as redis

# Rate limits by endpoint type
RATE_LIMITS = {
    "auth": {"requests": 5, "window": 60},      # 5 req/min for auth
    "api": {"requests": 100, "window": 60},     # 100 req/min for API
    "search": {"requests": 30, "window": 60},   # 30 req/min for search
}

async def rate_limit(request: Request, endpoint_type: str = "api"):
    redis_client = request.app.state.redis
    ip = request.client.host
    key = f"ratelimit:{ip}:{endpoint_type}"
    
    current = await redis_client.incr(key)
    if current == 1:
        await redis_client.expire(key, RATE_LIMITS[endpoint_type]["window"])
    
    if current > RATE_LIMITS[endpoint_type]["requests"]:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later."
        )
```

### 7.4 Input Validation

```python
from pydantic import BaseModel, EmailStr, Field, validator
import re

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12, max_length=128)
    username: str | None = Field(None, min_length=3, max_length=50)
    
    @validator('password')
    def validate_password(cls, v):
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain special character')
        return v
    
    @validator('username')
    def validate_username(cls, v):
        if v and not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, underscore, and hyphen')
        return v
```

### 7.5 CSRF Protection

- OAuth state parameter with Redis-backed storage
- SameSite cookie attribute for refresh tokens
- Origin/Referer header validation on sensitive endpoints

### 7.6 Security Headers

```python
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["malindra.com", "*.malindra.com", "localhost"]
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

### 7.7 Audit Logging

```python
import logging
from datetime import datetime

audit_logger = logging.getLogger("audit")

def log_auth_event(event_type: str, user_id: str, ip: str, details: dict = None):
    audit_logger.info({
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": event_type,
        "user_id": user_id,
        "ip_address": ip,
        "details": details or {}
    })

# Events to log:
# - login_success, login_failure
# - logout
# - register, verify_email
# - password_reset_request, password_reset_success
# - oauth_connect, oauth_disconnect
# - role_change, account_deactivated
```

---

## 8. Implementation Phases

### Phase 1: Core Authentication (Week 1-2)

1. **Database Migrations**
   - Modify users table for email/password support
   - Create sessions, password_reset_tokens tables
   - Add author_id to articles table

2. **Backend Services**
   - AuthService: registration, login, logout
   - Password hashing with Argon2
   - JWT generation and validation
   - Session management with Redis

3. **API Endpoints**
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/logout
   - POST /api/auth/refresh
   - GET /api/auth/me
   - POST /api/auth/password/reset-request
   - POST /api/auth/password/reset

4. **Frontend**
   - AuthProvider context
   - Login/Register pages
   - Token management utilities
   - Protected route component

### Phase 2: OAuth Integration (Week 3)

1. **Backend**
   - OAuth connection service
   - GitHub OAuth flow
   - Google OAuth flow
   - Callback handlers

2. **Database**
   - Create oauth_connections table
   - Migrate existing OAuth users

3. **Frontend**
   - OAuth buttons
   - Callback page handler
   - Account linking UI

### Phase 3: Authorization & Session Management (Week 4)

1. **Backend**
   - RBAC middleware
   - Permission decorators
   - Session listing/invalidation API
   - Rate limiting middleware

2. **Frontend**
   - Role-based UI rendering
   - Session management page

### Phase 4: Admin Dashboard (Week 5-6)

1. **User Management**
   - User list with pagination
   - Role assignment UI
   - User activation/deactivation

2. **Article Management**
   - Article editor with markdown preview
   - Article list with filters
   - Create/Edit/Delete operations
   - Author assignment

3. **Site Settings**
   - Settings page UI
   - Maintenance mode toggle
   - Registration toggle

### Phase 5: Polish & Security Hardening (Week 7)

1. **Security**
   - Audit logging
   - Rate limiting fine-tuning
   - Security headers verification
   - Penetration testing checklist

2. **UX Improvements**
   - Loading states
   - Error handling
   - Form validation feedback
   - Toast notifications

3. **Documentation**
   - API documentation updates
   - Admin user guide
   - Security documentation

---

## 9. File Structure Summary

### Backend Files to Create/Modify

| File Path | Description |
|-----------|-------------|
| `backend/app/models/user.py` | Modify: Add password_hash, is_active, is_verified |
| `backend/app/models/session.py` | Create: Session model |
| `backend/app/models/oauth_connection.py` | Create: OAuthConnection model |
| `backend/app/models/password_reset.py` | Create: PasswordResetToken model |
| `backend/app/models/analytics.py` | Create: AnalyticsEvent model |
| `backend/app/models/settings.py` | Create: SiteSettings model |
| `backend/app/services/auth.py` | Create: Authentication service |
| `backend/app/services/session.py` | Create: Session management service |
| `backend/app/services/oauth.py` | Create: OAuth integration service |
| `backend/app/services/email.py` | Create: Email sending service |
| `backend/app/api/routes/auth.py` | Create: Authentication endpoints |
| `backend/app/api/routes/admin.py` | Create: Admin management endpoints |
| `backend/app/api/deps.py` | Modify: Add auth dependencies |
| `backend/app/core/security.py` | Create: Password hashing, JWT utilities |
| `backend/app/core/rate_limit.py` | Create: Rate limiting middleware |
| `backend/alembic/versions/002_auth.py` | Create: Auth schema migration |

### Frontend Files to Create

| File Path | Description |
|-----------|-------------|
| `app/(auth)/login/page.tsx` | Login page |
| `app/(auth)/register/page.tsx` | Registration page |
| `app/(auth)/forgot-password/page.tsx` | Password reset request |
| `app/(auth)/reset-password/page.tsx` | Password reset form |
| `app/(auth)/callback/page.tsx` | OAuth callback handler |
| `app/(dashboard)/layout.tsx` | Dashboard layout |
| `app/(dashboard)/page.tsx` | Dashboard home |
| `app/(dashboard)/articles/page.tsx` | Article list |
| `app/(dashboard)/articles/new/page.tsx` | Create article |
| `app/(dashboard)/articles/[id]/edit/page.tsx` | Edit article |
| `app/(dashboard)/users/page.tsx` | User management |
| `app/(dashboard)/settings/page.tsx` | Site settings |
| `app/components/auth/AuthProvider.tsx` | Auth context provider |
| `app/components/auth/LoginForm.tsx` | Login form component |
| `app/components/auth/RegisterForm.tsx` | Registration form |
| `app/components/auth/ProtectedRoute.tsx` | Route protection |
| `app/components/dashboard/DashboardLayout.tsx` | Dashboard wrapper |
| `app/components/articles/ArticleEditor.tsx` | Markdown editor |
| `app/lib/auth/context.tsx` | Auth context definition |
| `app/lib/auth/hooks.ts` | Auth hooks |
| `app/lib/auth/tokens.ts` | Token management |
| `app/lib/auth/api.ts` | Auth API client |
| `app/lib/api/client.ts` | Base API client |

---

## 10. Success Criteria

- [ ] Users can register with email/password
- [ ] Users can login with email/password
- [ ] Users can login via Google OAuth
- [ ] Users can login via GitHub OAuth
- [ ] JWT access tokens expire and refresh automatically
- [ ] Sessions can be listed and invalidated
- [ ] Admins can manage user roles
- [ ] Editors can create/edit/delete articles
- [ ] Admin dashboard shows user list
- [ ] Rate limiting prevents brute force attacks
- [ ] All sensitive operations are audit logged
- [ ] Password reset flow works end-to-end
- [ ] Protected routes redirect unauthenticated users
- [ ] Role-based access control enforced on all endpoints
