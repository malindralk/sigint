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
pnpm dev          # Development server
pnpm build        # Static export to ./out/
pnpm start        # Production server
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
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/docs` | GET | Swagger UI documentation |
| `/api/articles` | GET | List all articles |
| `/api/articles/{slug}` | GET | Get single article |
| `/api/articles/sync` | POST | Sync content from git submodule |
| `/api/search` | GET/POST | Semantic search via embeddings |

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
| Frontend | ✅ Static export to `./out/` | Served by nginx |
| Backend API | ✅ Running | FastAPI on port 8000 |
| PostgreSQL | ✅ Running | With pgvector extension |
| Redis | ✅ Running | Cache/session store |
| Embeddings | ⚠️ Needs fix | `created_at` column issue in progress |
| Content Sync | ⚠️ Not tested | Waiting for embedding fix |
| RAG Search | ⚠️ Not tested | Waiting for content sync |
| Nginx | ✅ Configured | Zero warnings, SSL enabled |
| Fail2ban | ✅ Active | 7 jails monitoring |

## Known Issues

1. **Embedding service**: The `created_at` column in embeddings INSERT needs to be fixed
2. **Content sync**: Not yet tested with actual markdown files
3. **Search**: RAG semantic search not yet verified

## Next Steps

1. Fix embedding service SQL to include `created_at`
2. Rebuild backend Docker image
3. Test content sync from git submodule
4. Verify semantic search functionality
