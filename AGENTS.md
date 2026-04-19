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

## Technology Stack

### Frontend
- **Framework:** Next.js 16.2.3 (static export, `output: 'export'`)
- **React:** 19 with TypeScript 5
- **Styling:** Tailwind CSS 4.2.2 with PostCSS, CSS custom properties
- **Fonts:** Cormorant Garamond (display), DM Sans (UI), Noto Serif Sinhala (i18n)
- **Charts:** Recharts 2.15.0 (lazy-loaded via next/dynamic)
- **Visualization:** D3.js 7.9.0 (knowledge graph), Mermaid 11.14.0 (Gantt), Lucide React (icons)
- **Markdown:** React Markdown 9.0.1, Remark GFM, Rehype (highlight, slug, sanitize, raw)
- **State:** React Context (Auth, Locale), localStorage (theme, locale, consent)
- **i18n:** Custom Context — English + Sinhala (infrastructure for AR, TA, HI)

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL 16 with pgvector extension
- **Cache:** Redis 7 (Alpine)
- **ORM:** SQLAlchemy 2 (async with asyncpg)
- **Auth:** JWT + HTTPOnly refresh token cookies, Google OAuth 2.0
- **Embeddings:** HuggingFace sentence-transformers
- **Security:** Bcrypt, rate limiting, API key auth middleware

### Infrastructure
- **Containers:** Docker + Docker Compose
- **Web Server:** Nginx (SSL via Let's Encrypt, auth_request)
- **Security:** Fail2ban (7 jails), zero-trust policies

## Architecture Overview

### Static Site Export
This is a Next.js static site (`output: 'export'`). The build generates static HTML to `./out/`. All pages use `generateStaticParams()` for pre-rendering.

### Content System (Git Submodule)
- `content/` is a **git submodule** pointing to `https://github.com/malindralk/wiki.git`
- Markdown files live in `content/{em-sca,sigint,learning,infrastructure}/`
- `lib/content.ts` reads markdown with gray-matter frontmatter (title, description, order optional)
- `lib/graph-data.ts` extracts `[[wiki links]]` to build the knowledge graph

### Dynamic Routes
- `/[category]` — lists articles in a category
- `/[category]/[slug]` — renders individual article via `ArticleView`

### Internationalization (i18n)
- **Languages:** English (default), Sinhala
- **Implementation:** React Context in `app/hooks/useLocale.tsx`, translations in `lib/i18n.ts`
- **Persistence:** localStorage
- **Scope:** All sidebar items, mobile drawer, footer links, section headers
- **Toggle:** Language switcher in sidebar and mobile header (EN | si)

### Brand & Design System
- **Palette:** Heritage-inspired (Kotte Kingdom) — Sinha Maroon, Temple Gold, Water Fortress, War Banner, Zheng He Blue
- **Tokens:** Single source of truth in `.brand/tokens.css`
- **Integration:** CSS custom properties in `app/globals.css`, JS constants in `lib/brand-colors.ts`
- **Rule:** Never hardcode hex/rgba values — always use CSS variables from the brand system
- **Themes:** Dark/light mode via `[data-theme]` attribute and CSS custom properties

### Key Files
| File | Purpose |
|------|---------|
| `lib/content.ts` | Article loading, category definitions, markdown parsing |
| `lib/viz-data.ts` | Static datasets (market growth, companies, SDR hardware, research papers) |
| `lib/graph-data.ts` | Knowledge graph node/edge extraction from markdown links |
| `lib/i18n.ts` | Translation strings for EN/SI |
| `lib/brand-colors.ts` | Brand color constants for JS/chart contexts |
| `app/hooks/useLocale.tsx` | i18n context provider and hook |
| `app/components/Sidebar.tsx` | Desktop sidebar navigation (locale-aware) |
| `app/components/MobileHeader.tsx` | Mobile hamburger drawer (locale-aware) |
| `app/components/Footer.tsx` | Site footer (locale-aware) |
| `app/components/ArticleView.tsx` | Article rendering with markdown, mermaid, syntax highlighting |
| `app/components/MarkdownRenderer.tsx` | rehype/remark pipeline for markdown |
| `app/lib/auth/context.tsx` | AuthProvider, useAuth hook |
| `app/components/auth/ProtectedRoute.tsx` | Client-side auth gate |
| `.brand/tokens.css` | Design token definitions (single source of truth) |
| `.brand/tailwind.css` | Tailwind 4 @theme integration |
| `.brand/base.css` | Base CSS resets and variables |

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

## Pages & Routes

### Main Pages
| Route | Purpose |
|-------|---------|
| `/` | Home/landing page |
| `/[category]` | Category article listing |
| `/[category]/[slug]` | Individual article view |
| `/graph` | Knowledge graph (D3 force-directed) |
| `/market` | Market intelligence charts |
| `/companies` | Company explorer grid |
| `/equipment` | Equipment comparison scatter |
| `/research` | Research papers timeline |
| `/learning` | Learning path (Gantt chart) |

### Content Pages
| Route | Purpose |
|-------|---------|
| `/archive` | Full article archive |
| `/archive/category/[category]` | Archive by category |
| `/archive/tag/[tag]` | Archive by tag |
| `/archive/curated` | Curated selection |
| `/blog` | Blog posts |
| `/blog/[slug]` | Blog post detail |

### Legal & Info
| Route | Purpose |
|-------|---------|
| `/contact` | Contact page (info@malindra.lk) |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/compliance` | Compliance/regulatory info |

### Auth & User
| Route | Purpose |
|-------|---------|
| `/login` | Google OAuth login |
| `/callback` | OAuth callback handler |
| `/account` | User profile |
| `/subscribe` | Subscription plans |

### Protected (Dashboard)
| Route | Purpose |
|-------|---------|
| `/dashboard` | Admin overview |
| `/dashboard/articles` | Article management |
| `/dashboard/articles/new` | Create article |
| `/dashboard/users` | User management |
| `/dashboard/settings` | Site settings |
| `/dashboard/predictions` | Predictions dashboard |

## Backend Architecture

### Services (Docker Compose)
| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| PostgreSQL | sigint-db | 5432 | Database with pgvector extension for embeddings |
| Redis | sigint-redis | 6379 | Cache, session store, rate limiting |
| FastAPI | sigint-backend | 8000 | REST API for content sync, search, auth |

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
| `/api/auth/oauth/google` | GET | Initiate Google OAuth login |
| `/api/auth/oauth/google/callback` | GET | Google OAuth callback handler |
| `/api/auth/logout` | POST | Logout current session |
| `/api/auth/refresh` | POST | Refresh access token (cookie-based) |
| `/api/auth/me` | GET | Get current user info |
| `/api/auth/sessions` | GET | List active sessions |
| `/api/auth/sessions/{id}` | DELETE | Invalidate session |
| `/api/auth/verify` | GET | Verify session (for Nginx auth_request) |

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

#### Additional Route Modules
`ai.py`, `analytics.py`, `compliance.py`, `connectors.py`, `consent.py`, `editorial.py`, `engagement.py`, `enrichment.py`, `enterprise.py`, `export.py`, `leads.py`, `monitoring.py`, `newsletter.py`, `partners.py`, `social.py`, `subscriptions.py`, `telemetry.py`

### Persistent Storage
All Docker data is stored in `backend/data/` (bind mounts):
- `backend/data/postgres/` — PostgreSQL database files
- `backend/data/redis/` — Redis persistence
- `backend/data/logs/` — Application logs (rotating 10 x 50MB)
- `backend/models_cache/` — HuggingFace model cache

## Infrastructure

### Nginx Configuration
- Config files in `.nginx/` directory
- Main site: `malindra.com.conf` (proxies to static files, auth_request for /dashboard)
- SSL certificates via Let's Encrypt
- Fail2ban for security

### Security
- Fail2ban jails in `.fail2ban/jail.local`
- Setup script: `.bash/setup-fail2ban.sh`
- Monitors: SSH, nginx auth, bots, bad requests
- Nginx auth_request protects `/dashboard` routes
- GDPR consent tracking via `ConsentDialog` component

### Useful Scripts
| Script | Purpose |
|--------|---------|
| `.bash/configure-nginx.sh` | Configure nginx to include repo configs |
| `.bash/certbot-setup.sh` | SSL certificate management |
| `.bash/setup-fail2ban.sh` | Install and configure fail2ban |
| `.bash/init-submodules.sh` | Initialize git submodules |
| `scripts/generate-static-seo.mjs` | Pre-build SEO generation |
| `scripts/generate-og-images.mjs` | Post-build OG image generation (Satori) |
| `scripts/generate-charts.mjs` | Pre-build chart generation |
| `scripts/generate-sri-hashes.mjs` | Post-build SRI hash generation |
| `scripts/performance-audit.mjs` | Post-build performance audit |
| `scripts/ai-synthesis.py` | AI-driven content synthesis |

## Project Structure

```
sigint/
├── app/                          # Next.js frontend
│   ├── (auth)/                   # Auth routes (login, callback, register)
│   ├── dashboard/                # Protected admin dashboard
│   ├── [category]/               # Dynamic article routes
│   ├── archive/                  # Content archive
│   ├── blog/                     # Blog posts
│   ├── contact/                  # Contact page
│   ├── privacy/                  # Privacy policy
│   ├── terms/                    # Terms of service
│   ├── compliance/               # Compliance info
│   ├── graph/                    # Knowledge graph visualization
│   ├── market/                   # Market intelligence
│   ├── companies/                # Company explorer
│   ├── equipment/                # SDR hardware specs
│   ├── research/                 # Research timeline
│   ├── learning/                 # Learning paths
│   ├── subscribe/                # Subscription plans
│   ├── account/                  # User profile
│   ├── components/               # React components
│   │   ├── Sidebar.tsx           # Desktop nav (locale-aware)
│   │   ├── MobileHeader.tsx      # Mobile hamburger drawer (locale-aware)
│   │   ├── Footer.tsx            # Site footer (locale-aware)
│   │   ├── ArticleView.tsx       # Article renderer
│   │   ├── MarkdownRenderer.tsx  # Remark/rehype pipeline
│   │   ├── KnowledgeGraph.tsx    # D3 force-directed graph
│   │   ├── MarketCharts.tsx      # Recharts visualizations
│   │   ├── CompanyGrid.tsx       # Company cards
│   │   ├── EquipmentViz.tsx      # SDR scatter chart
│   │   ├── ResearchCharts.tsx    # Research timeline
│   │   ├── GanttChart.tsx        # Mermaid Gantt renderer
│   │   ├── auth/                 # OAuthButtons, ProtectedRoute
│   │   └── consent/              # ConsentDialog, MinimalFooter
│   ├── hooks/
│   │   ├── useLocale.tsx         # i18n context (EN/SI)
│   │   └── useConsent.ts         # Privacy consent hook
│   ├── lib/
│   │   ├── auth/                 # AuthProvider, tokens, hooks
│   │   └── api/                  # API client, articles, users
│   ├── layout.tsx                # Root layout (AuthProvider + LocaleProvider)
│   └── globals.css               # Tailwind 4 + design tokens
├── lib/                          # Shared utilities
│   ├── content.ts                # Article loading, categories
│   ├── i18n.ts                   # Translation strings (EN/SI)
│   ├── graph-data.ts             # Knowledge graph builder
│   ├── viz-data.ts               # Static data for visualizations
│   ├── brand-colors.ts           # Brand color JS constants
│   ├── blog-data.ts              # Blog post data
│   ├── predictions.ts            # Prediction engine
│   └── utils.ts                  # General utilities
├── hooks/                        # Root-level hooks
│   ├── use-mobile.ts             # Mobile breakpoint detector
│   └── use-theme.ts              # Dark/light theme toggle
├── components/                   # Root-level shared components
│   ├── ui/                       # shadcn/ui components
│   └── LanguageToggle.tsx        # i18n language selector
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── main.py               # FastAPI app initialization
│   │   ├── api/routes/           # 23+ route modules
│   │   ├── models/               # SQLAlchemy models
│   │   ├── services/             # Embedding, search, auth, OAuth
│   │   ├── core/                 # Config, database, security, rate limiting
│   │   └── middleware/           # Auth, compliance middleware
│   ├── data/                     # Persistent Docker volumes
│   ├── models_cache/             # HuggingFace model cache
│   ├── docker-compose.yml        # Service orchestration
│   └── Dockerfile                # FastAPI image
├── content/                      # Git submodule (markdown articles)
│   ├── em-sca/                   # EM-SCA articles
│   ├── sigint/                   # SIGINT articles
│   ├── learning/                 # Learning paths
│   └── infrastructure/           # Infrastructure articles
├── public/                       # Static assets (robots.txt, OG images, charts)
├── scripts/                      # Build & generation scripts
├── .brand/                       # Design tokens & brand CSS
│   ├── tokens.css                # Color/spacing/shadow tokens (source of truth)
│   ├── tailwind.css              # Tailwind 4 @theme integration
│   └── base.css                  # Base CSS resets
├── .nginx/                       # Nginx configurations
├── .fail2ban/                    # Fail2ban security jails
├── .bash/                        # Setup scripts
├── .github/                      # CI/CD workflows
├── mal.py                        # CLI tool (installed as `mal` command)
└── AGENTS.md                     # This file
```

## Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend | Live | Next.js 16, static export to `./out/`, served by nginx |
| Backend API | Running | FastAPI on port 8000 |
| PostgreSQL | Running | With pgvector extension |
| Redis | Running | Cache/session store/rate limiting |
| Authentication | Google OAuth only | JWT + HTTPOnly cookie sessions |
| i18n | English + Sinhala | Sidebar, mobile drawer, footer all locale-aware |
| Brand System | Complete | Heritage palette, all colors tokenised in `.brand/` |
| Mobile Navigation | Implemented | Hamburger drawer with auth state + locale toggle |
| Contact Page | Live | `/contact` with info@malindra.lk |
| Privacy & Terms | Live | `/privacy` and `/terms` |
| Admin Dashboard | Implemented | User/article/settings management |
| Visualizations | Live | Knowledge graph, market charts, equipment, research, Gantt |
| Performance | Optimised | recharts/mermaid/highlight lazy-loaded via next/dynamic |
| Content Sync | Ready | Tested and working (requires auth) |
| RAG Search | Ready | Semantic search via pgvector embeddings |
| Nginx | Configured | SSL, auth_request for /dashboard |
| Fail2ban | Active | 7 jails monitoring |
| Google OAuth verification | Pending | Submitted for Google review |

## Styling Rules

1. **Never hardcode hex/rgba values** — always use CSS custom properties from `.brand/tokens.css`
2. **Brand tokens** are the single source of truth — `app/globals.css` references them via `var(--color-*)`
3. **Theme variables** (`--theme-*`) adapt to dark/light mode automatically
4. **Alpha tints** are pre-defined (e.g., `--color-zheng-he-08`, `--color-sinha-maroon-30`) — use these instead of inline rgba
5. **Sidebar hierarchy:** Section titles use uppercase/small-caps with no background; buttons use rounded filled backgrounds with hover states
6. **Update `.brand/` files** whenever new colour variables are added to `globals.css`

## Environment Variables

Add these to `backend/.env`:

```bash
# Application
APP_ENV=production
FRONTEND_URL=https://malindra.com

# OAuth (Google only)
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
