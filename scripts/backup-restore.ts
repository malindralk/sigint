// MALINDRA PHASE 4
// scripts/backup-restore.ts
// Backs up ./data/, ./content/, public/social/, public/charts/
// Outputs timestamped archives to ./backups/
// Usage:
//   node --experimental-vm-modules scripts/backup-restore.mjs backup
//   node --experimental-vm-modules scripts/backup-restore.mjs restore ./backups/2026-04-19T12-00-00.tar.gz

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

// This script is designed to be called as: node scripts/backup-restore.mjs [backup|restore] [archivePath]

const ROOT = process.cwd();
const BACKUPS_DIR = join(ROOT, 'backups');

const BACKUP_SOURCES = [
  'data',
  'content/drafts',
  'content/review',
  'content/published',
  'public/social',
  'public/charts',
  'public/dashboard',
];

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function ensureDir(p: string): void {
  mkdirSync(p, { recursive: true });
}

function backup(): void {
  ensureDir(BACKUPS_DIR);
  const ts = timestamp();
  const archiveName = `malindra-backup-${ts}.tar.gz`;
  const archivePath = join(BACKUPS_DIR, archiveName);

  // Collect existing source paths
  const sources = BACKUP_SOURCES.filter((s) => existsSync(join(ROOT, s)));

  if (sources.length === 0) {
    console.log('[backup] No source directories found to backup.');
    return;
  }

  try {
    const sourceArgs = sources.map((s) => `"${s}"`).join(' ');
    execSync(`tar -czf "${archivePath}" ${sourceArgs}`, { cwd: ROOT, stdio: 'pipe' });
    const size = statSync(archivePath).size;
    console.log(`[backup] Created: ${archiveName} (${(size / 1024).toFixed(0)} KB)`);

    // Write manifest
    const manifest = {
      created_at: new Date().toISOString(),
      archive: archiveName,
      sources_included: sources,
      size_bytes: size,
    };
    writeFileSync(join(BACKUPS_DIR, `${archiveName}.manifest.json`), JSON.stringify(manifest, null, 2), 'utf-8');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[backup] Failed to create archive: ${msg}`);
    // Fallback: write a metadata-only backup
    const meta = {
      created_at: new Date().toISOString(),
      note: 'tar unavailable — metadata-only backup',
      sources: sources,
    };
    writeFileSync(join(BACKUPS_DIR, `malindra-meta-${ts}.json`), JSON.stringify(meta, null, 2), 'utf-8');
    console.log(`[backup] Metadata-only backup written to backups/malindra-meta-${ts}.json`);
  }

  // Prune: keep last 10 backups
  const archives = readdirSync(BACKUPS_DIR)
    .filter((f) => f.startsWith('malindra-backup-') && f.endsWith('.tar.gz'))
    .sort()
    .reverse();
  if (archives.length > 10) {
    for (const old of archives.slice(10)) {
      try {
        rmSync(join(BACKUPS_DIR, old));
        const mf = join(BACKUPS_DIR, `${old}.manifest.json`);
        if (existsSync(mf)) rmSync(mf);
        console.log(`[backup] Pruned old backup: ${old}`);
      } catch {
        // non-critical
      }
    }
  }
}

function restore(archivePath: string): void {
  if (!existsSync(archivePath)) {
    console.error(`[restore] Archive not found: ${archivePath}`);
    process.exit(1);
  }

  const manifestPath = `${archivePath}.manifest.json`;
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    console.log(`[restore] Archive created: ${manifest.created_at}`);
    console.log(`[restore] Sources: ${manifest.sources_included?.join(', ')}`);
  }

  try {
    execSync(`tar -xzf "${archivePath}"`, { cwd: ROOT, stdio: 'inherit' });
    console.log(`[restore] Restore complete from: ${basename(archivePath)}`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[restore] Failed: ${msg}`);
    process.exit(1);
  }
}

// ── CLI entry ─────────────────────────────────────────────────────────────────

const [, , command, target] = process.argv;

if (command === 'backup') {
  backup();
} else if (command === 'restore') {
  if (!target) {
    console.error('[restore] Usage: node scripts/backup-restore.mjs restore <archive-path>');
    process.exit(1);
  }
  restore(target);
} else {
  // Default: backup
  backup();
}
