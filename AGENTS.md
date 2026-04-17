# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

## Quick Start (Use the CLI)

```bash
mal status              # Check project status
mal build-frontend      # Build static site
mal start-backend       # Start all backend services
mal sync-content        # Sync articles and generate embeddings
```

## Build & Run Commands

### Frontend (Next.js Static Export)
```bash
# pnpm is not installed — use node directly:
node node_modules/next/dist/bin/next build   # Static export to ./out/
node node_modules/next/dist/bin/next dev     # Development server

# Node binary location (nvm):
# /home/www/.nvm/versions/node/v24.14.1/bin/node
# Add to PATH: export PATH="/home/www/.nvm/versions/node/v24.14.1/bin:$PATH"
```

### Backend (FastAPI + PostgreSQL + Redis)
```bash
cd backend

docker compose up -d              # Start all services
docker compose build backend      # Rebuild backend image
docker compose logs -f backend    # View logs

curl http://localhost:8000/       # Test API
curl http://localhost:8000/docs   # API documentation (Swagger UI)
```

### Content Sync & Search
```bash
# Sync content from git submodule and generate embeddings
curl -X POST "http://localhost:8000/api/articles/sync?generate_embeddings=true"

# Search articles via semantic search
curl "http://localhost:8000/api/search?q=SDR+hardware&limit=5"
```

No lint or test commands are configured.

## Architecture Overview

### Static Site Export
This is a Next.js static site (`output: 'export'`). The build generates static HTML to `./out/`. All pages use `generateStaticParams()` for pre-rendering.

### Content System (Git Submodule)
- `content/` is a **git submodule** pointing to `https://github.com/malindralk/wiki.git`
- Markdown files live in `content/{em-sca,sigint,learning}/`
- `lib/content.ts` reads markdown with gray-matter frontmatter (title, description, order optional)
- `lib/graph-data.ts` extracts `[[wiki links]]` to build the knowledge graph

### Dynamic Routes
- `/[category]` → lists articles in a category
- `/[category]/[slug]` → renders individual article via `ArticleView`

### Key Files
| File | Purpose |
|------|---------|
| `lib/content.ts` | Article loading, category definitions, markdown parsing |
| `lib/viz-data.ts` | Static datasets (market growth, companies, SDR hardware, research papers) |
| `lib/graph-data.ts` | Knowledge graph node/edge extraction from markdown links |
| `app/components/ArticleView.tsx` | Article rendering with markdown, mermaid, syntax highlighting |
| `app/components/MarkdownRenderer.tsx` | rehype/remark pipeline for markdown |

### Styling
Tailwind CSS 4.x with CSS custom properties in `app/globals.css`. Theme uses CSS variables (`--brand-primary`, `--space-*`, etc.).

### Adding Articles
Create `.md` files in `content/{em-sca,sigint,learning}/`. Optional frontmatter:

```yaml
---
title: Article Title
description: Brief summary
order: 1
---
```

Title/description are auto-extracted from first H1 and first paragraph if omitted.

### Git Submodule Operations
The `content/` directory is a separate repository. To update content:

```bash
cd content
git add .
git commit -m "Update articles"
git push origin main
```

Changes to `content/` must be pushed from within that directory.

## Backend Architecture

### Services (Docker Compose)
| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| PostgreSQL | sigint-db | 5432 | Database with pgvector extension for embeddings |
| Redis | sigint-redis | 6379 | Cache and session store |
| FastAPI | sigint-backend | 8000 | REST API for content sync and search |

### API Endpoints

#### Public Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/docs` | GET | Swagger UI documentation |
| `/api/articles` | GET | List all articles |
| `/api/articles/{slug}` | GET | Get single article |
| `/api/search` | GET/POST | Semantic search via embeddings |

#### Authentication Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/logout` | POST | Logout current session |
| `/api/auth/refresh` | POST | Refresh access token (cookie-based) |
| `/api/auth/me` | GET | Get current user info |
| `/api/auth/sessions` | GET | List active sessions |
| `/api/auth/sessions/{id}` | DELETE | Invalidate session |
| `/api/auth/oauth/google` | GET | Initiate Google OAuth login |
| `/api/auth/oauth/google/callback` | GET | Google OAuth callback handler |

> **Note:** Email/password registration and login endpoints exist in the backend but are not exposed in the UI. Authentication is Google OAuth only.

#### Admin Endpoints (requires authentication)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/articles/sync` | POST | Sync content from git submodule |
| `/api/admin/users` | GET | List all users |
| `/api/admin/users/{id}` | GET | Get user details |
| `/api/admin/users/{id}` | PATCH | Update user role/status |
| `/api/admin/users/{id}` | DELETE | Deactivate user |
| `/api/admin/articles` | POST | Create new article |
| `/api/admin/articles/{id}` | PATCH | Update article |
| `/api/admin/articles/{id}` | DELETE | Delete article |
| `/api/admin/settings` | GET | Get site settings |
| `/api/admin/settings` | PATCH | Update site settings |

### Persistent Storage
All Docker data is stored in `backend/data/` (bind mounts):
- `backend/data/postgres/` - PostgreSQL database files
- `backend/data/redis/` - Redis persistence
- `backend/models_cache/` - HuggingFace model cache

## Infrastructure

### Nginx Configuration
- Config files in `.nginx/` directory
- Main site: `malindra.com.conf` (proxies to static files)
- SSL certificates via Let's Encrypt
- Fail2ban for security

### Security
- Fail2ban jails in `.fail2ban/jail.local`
- Setup script: `.bash/setup-fail2ban.sh`
- Monitors: SSH, nginx auth, bots, bad requests

### Useful Scripts (in `.bash/`)
| Script | Purpose |
|--------|---------|
| `configure-nginx.sh` | Configure nginx to include repo configs |
| `certbot-setup.sh` | SSL certificate management |
| `setup-fail2ban.sh` | Install and configure fail2ban |
| `init-submodules.sh` | Initialize git submodules |

## Project Structure

```
sigint/
├── app/                    # Next.js frontend
│   ├── components/         # React components
│   ├── [category]/         # Dynamic routes
│   └── globals.css         # Tailwind + custom properties
├── backend/                # FastAPI backend
│   ├── app/                # Python application
│   │   ├── api/routes/     # API endpoints
│   │   ├── models/         # SQLAlchemy models
│   │   └── services/       # Embedding, content sync
│   ├── data/               # Persistent Docker storage
│   └── docker-compose.yml  # Service orchestration
├── content/                # Git submodule (markdown articles)
├── lib/                    # Frontend utilities
├── .nginx/                 # Nginx configurations
├── .fail2ban/              # Fail2ban configuration
├── .bash/                  # Setup scripts
├── mal.py                  # CLI tool (installed as `mal` command)
└── AGENTS.md               # This file
```

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | ✅ Live | Static export to `./out/`, served by nginx |
| Backend API | ✅ Running | FastAPI on port 8000 |
| PostgreSQL | ✅ Running | With pgvector extension |
| Redis | ✅ Running | Cache/session store |
| Authentication | ✅ Google OAuth only | JWT + HTTPOnly cookie sessions, email/password UI removed |
| Mobile navigation | ✅ Implemented | Hamburger drawer with auth state |
| Privacy & Terms pages | ✅ Live | `/privacy` and `/terms` |
| Admin Dashboard | ✅ Implemented | User/article management |
| Performance | ✅ Optimised | recharts/mermaid/highlight lazy-loaded via next/dynamic |
| Embeddings | ⚠️ Needs fix | `created_at` column issue in embeddings INSERT |
| Content Sync | ⚠️ Not tested | Waiting for embedding fix |
| RAG Search | ⚠️ Not tested | Waiting for content sync |
| Nginx | ✅ Configured | Zero warnings, SSL enabled |
| Fail2ban | ✅ Active | 7 jails monitoring |
| Google OAuth verification | ⏳ Pending | Submitted for Google review |

## Known Issues

1. **Embedding service**: The `created_at` column in embeddings INSERT needs to be fixed
2. **Content sync**: Not yet tested with actual markdown files
3. **Search**: RAG semantic search not yet verified

## Next Steps

1. Fix embedding service SQL to include `created_at`
2. Test content sync from git submodule
3. Verify semantic search functionality
4. Complete Google OAuth app verification

## Environment Variables

Add these to `backend/.env`:

```bash
# Application
APP_ENV=production
FRONTEND_URL=https://malindra.com

# OAuth (Google only — GitHub removed)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# Authorised redirect URI must be: https://malindra.com/api/auth/oauth/google/callback

# SMTP Settings (optional, for transactional emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=info@malindra.lk

# Security (change in production!)
SECRET_KEY=your-secret-key-here

# Redis (use container hostname in Docker, localhost otherwise)
REDIS_URL=redis://redis:6379/0
```
