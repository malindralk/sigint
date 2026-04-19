#!/usr/bin/env node
// MALINDRA PHASE 3
// scripts/trigger-rebuild.mjs
// Manually trigger a Vercel/Cloudflare/GitHub Pages rebuild.
// Reads REBUILD_WEBHOOK_URL from env or .env.local.
// Logs result to ./data/build-logs/build-log.json.
// Usage: node scripts/trigger-rebuild.mjs [--slug=some-slug] [--event=content_published]

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOG_FILE = join(ROOT, 'data', 'build-logs', 'build-log.json');

mkdirSync(join(ROOT, 'data', 'build-logs'), { recursive: true });

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const slug = args.find((a) => a.startsWith('--slug='))?.replace('--slug=', '') ?? 'manual';
const event = args.find((a) => a.startsWith('--event='))?.replace('--event=', '') ?? 'manual_rebuild';

// ── Load env ──────────────────────────────────────────────────────────────────
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const path = join(ROOT, file);
    if (!existsSync(path)) continue;
    const lines = readFileSync(path, 'utf-8').split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split('=');
      if (key && !key.startsWith('#') && rest.length) {
        process.env[key.trim()] = rest
          .join('=')
          .trim()
          .replace(/^["']|["']$/g, '');
      }
    }
  }
}

loadEnv();

const WEBHOOK_URL = process.env.REBUILD_WEBHOOK_URL ?? '';

// ── Log helper ────────────────────────────────────────────────────────────────
function appendLog(entry) {
  let log = [];
  if (existsSync(LOG_FILE)) {
    try {
      log = JSON.parse(readFileSync(LOG_FILE, 'utf-8'));
    } catch {}
  }
  log.push({ ...entry, timestamp: new Date().toISOString() });
  log = log.slice(-200); // keep last 200
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// ── Main ──────────────────────────────────────────────────────────────────────

if (!WEBHOOK_URL) {
  console.warn('[rebuild] REBUILD_WEBHOOK_URL not set — skipping webhook');
  appendLog({ action: 'rebuild_skipped', slug, event, reason: 'no_webhook_url', status: 'skipped' });
  process.exit(0);
}

console.log(`[rebuild] Triggering rebuild for slug="${slug}", event="${event}"`);
console.log(`[rebuild] Webhook: ${WEBHOOK_URL.slice(0, 40)}…`);

try {
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref: 'main',
      event_type: event,
      client_payload: { slug, triggeredBy: 'malindra-editorial' },
    }),
    signal: AbortSignal.timeout(15000),
  });

  const status = res.status;
  const ok = res.ok || status === 204;

  if (ok) {
    console.log(`[rebuild] Webhook accepted — HTTP ${status}`);
    appendLog({ action: 'rebuild_triggered', slug, event, status: 'success', httpStatus: status });
  } else {
    const body = await res.text().catch(() => '');
    console.error(`[rebuild] Webhook rejected — HTTP ${status}: ${body.slice(0, 200)}`);
    appendLog({ action: 'rebuild_triggered', slug, event, status: 'webhook_error', httpStatus: status });
    process.exit(1);
  }
} catch (err) {
  console.error(`[rebuild] Webhook exception: ${err.message}`);
  appendLog({ action: 'rebuild_triggered', slug, event, status: 'exception', error: err.message });
  process.exit(1);
}
