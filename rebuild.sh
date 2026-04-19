#!/bin/bash
# MALINDRA PHASE 4
# rebuild.sh — Full Phase 4 build + restart pipeline
# Usage: ./rebuild.sh [--skip-lhci] [--skip-docker] [--skip-backup]

set -e

echo "=== Malindra Phase 4 Rebuild ==="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status()  { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }
print_step()    { echo -e "\n${CYAN}── $1${NC}"; }

SKIP_LHCI=false
SKIP_DOCKER=false
SKIP_BACKUP=false

for arg in "$@"; do
  case $arg in
    --skip-lhci)   SKIP_LHCI=true ;;
    --skip-docker) SKIP_DOCKER=true ;;
    --skip-backup) SKIP_BACKUP=true ;;
  esac
done

if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
  print_error "Please run this script from /home/www/sigint"
  exit 1
fi

# ── Node.js / package manager detection ──────────────────────────────────────
export PATH="/home/www/.nvm/versions/node/v24.14.1/bin:$PATH"

if command -v pnpm &> /dev/null; then
  PM="pnpm"
elif command -v npm &> /dev/null; then
  PM="npm"
else
  print_error "Neither pnpm nor npm found."
  exit 1
fi
print_status "Package manager: $PM"

# ── Step 1: Install dependencies ─────────────────────────────────────────────
print_step "1. Install dependencies"
$PM install

# ── Step 2: TypeScript check ──────────────────────────────────────────────────
print_step "2. TypeScript check"
node node_modules/typescript/bin/tsc --noEmit || print_warning "TypeScript errors found — continuing"

# ── Step 3: Create Phase 4 data directories ───────────────────────────────────
print_step "3. Create data directories"
mkdir -p data/predictions data/enterprise data/audit data/external/cbsl \
         data/external/trade data/external/lki public/dashboard backups

# ── Step 4: AI synthesis (Python) ─────────────────────────────────────────────
print_step "4. AI signal synthesis"
if command -v python3 &> /dev/null; then
  python3 scripts/ai-synthesis.py || print_warning "AI synthesis failed — continuing with existing predictions"
else
  print_warning "python3 not found — skipping AI synthesis"
fi

# ── Step 5: Data enrichment ───────────────────────────────────────────────────
print_step "5. Data enrichment"
node scripts/enrich-data.mjs || print_warning "Enrichment failed — continuing with cached data"

# ── Step 6: Generate charts ───────────────────────────────────────────────────
print_step "6. Generate SVG charts"
node scripts/generate-charts.mjs || print_warning "Chart generation failed — continuing"

# ── Step 7: Generate social packages ─────────────────────────────────────────
print_step "7. Generate social packages"
node scripts/generate-social-assets.mjs || print_warning "Social generation failed — continuing"

# ── Step 8: Build static export ───────────────────────────────────────────────
print_step "8. Build static export"
node scripts/generate-static-seo.mjs
node node_modules/next/dist/bin/next build
print_status "Static export complete"

# ── Step 9: Postbuild ────────────────────────────────────────────────────────
print_step "9. Post-build (OG images)"
node scripts/generate-og-images.mjs || print_warning "OG image generation failed"

# ── Step 10: Backup ───────────────────────────────────────────────────────────
if [ "$SKIP_BACKUP" = false ]; then
  print_step "10. Backup data"
  node --input-type=module << 'EOF' || print_warning "Backup failed"
    import { execSync } from 'child_process';
    import { existsSync, mkdirSync } from 'fs';
    const ts = new Date().toISOString().replace(/[:.]/g,'_').slice(0,19);
    mkdirSync('backups', { recursive: true });
    try {
      execSync(`tar -czf backups/malindra-backup-${ts}.tar.gz data public/social public/charts public/dashboard`, { stdio: 'pipe' });
      console.log('[backup] Created: malindra-backup-' + ts + '.tar.gz');
    } catch(e) {
      console.warn('[backup] tar failed — skipping');
    }
EOF
fi

# ── Step 11: Lighthouse CI ────────────────────────────────────────────────────
if [ "$SKIP_LHCI" = false ]; then
  print_step "11. Lighthouse CI"
  if command -v lhci &> /dev/null; then
    lhci autorun || print_warning "Lighthouse CI failed — check scores"
  else
    print_warning "lhci not found — skipping. Install: npm install -g @lhci/cli"
  fi
fi

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
print_status "Phase 4 rebuild complete."
print_status "Static export: out/"
print_status "Predictions: data/predictions/"
print_status "Social packages: public/social/"
print_status "Dashboard: public/dashboard/"
echo ""
echo "To preview: npx serve out"
echo "To start FastAPI: cd backend && uvicorn app.main:app --reload"
