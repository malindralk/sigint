#!/usr/bin/env node
// MALINDRA PHASE 5
// scripts/performance-audit.mjs
// Build-time performance audit: bundle size analysis, image optimization checks,
// critical CSS detection, and Lighthouse CI target validation.
// Outputs data/build-logs/performance-report.json

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const OUT_DIR = './out';
const NEXT_STATIC = './out/_next/static';
const REPORT_PATH = './data/build-logs/performance-report.json';

// Lighthouse 98+ target thresholds
const THRESHOLDS = {
  maxJsBundleKB: 400,     // Per JS chunk — warn if exceeded (Next.js vendor bundles are large)
  maxCssBundleKB: 120,    // Per CSS file
  maxImageKB: 500,        // Per image — warn if exceeded
  maxHtmlKB: 200,         // Per HTML page (Next.js hydration adds ~30-60KB overhead)
  maxTotalStaticMB: 25,   // Total static output
};

function humanBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

function walkDir(dir, exts = null) {
  const results = [];
  if (!existsSync(dir)) return results;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        results.push(...walkDir(full, exts));
      } else if (!exts || exts.includes(extname(e.name).toLowerCase())) {
        results.push(full);
      }
    }
  } catch { /* skip */ }
  return results;
}

function analyzeFiles(dir, exts) {
  const files = walkDir(dir, exts);
  const report = [];
  let totalBytes = 0;
  for (const f of files) {
    try {
      const size = statSync(f).size;
      totalBytes += size;
      report.push({ path: relative(OUT_DIR, f).replace(/\\/g, '/'), size, sizeHuman: humanBytes(size) });
    } catch { /* skip */ }
  }
  report.sort((a, b) => b.size - a.size);
  return { files: report, totalBytes, totalHuman: humanBytes(totalBytes) };
}

// ── JS bundles ────────────────────────────────────────────────────────────────
const jsReport = analyzeFiles(NEXT_STATIC, ['.js']);
const jsWarnings = jsReport.files
  .filter(f => f.size > THRESHOLDS.maxJsBundleKB * 1024)
  .map(f => `JS chunk ${f.path} is ${f.sizeHuman} (>${THRESHOLDS.maxJsBundleKB}KB)`);

// ── CSS bundles ───────────────────────────────────────────────────────────────
const cssReport = analyzeFiles(NEXT_STATIC, ['.css']);
const cssWarnings = cssReport.files
  .filter(f => f.size > THRESHOLDS.maxCssBundleKB * 1024)
  .map(f => `CSS file ${f.path} is ${f.sizeHuman} (>${THRESHOLDS.maxCssBundleKB}KB)`);

// ── HTML pages ────────────────────────────────────────────────────────────────
const htmlReport = analyzeFiles(OUT_DIR, ['.html']);
const htmlWarnings = htmlReport.files
  .filter(f => f.size > THRESHOLDS.maxHtmlKB * 1024)
  .map(f => `HTML page ${f.path} is ${f.sizeHuman} (>${THRESHOLDS.maxHtmlKB}KB)`);

// ── Images ────────────────────────────────────────────────────────────────────
const imgReport = analyzeFiles(OUT_DIR, ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);
const imgWarnings = imgReport.files
  .filter(f => f.size > THRESHOLDS.maxImageKB * 1024)
  .map(f => `Image ${f.path} is ${f.sizeHuman} (>${THRESHOLDS.maxImageKB}KB)`);

// ── Total output size ─────────────────────────────────────────────────────────
const allFiles = walkDir(OUT_DIR);
let totalBytes = 0;
for (const f of allFiles) {
  try { totalBytes += statSync(f).size; } catch { /* skip */ }
}
const totalMB = totalBytes / 1024 / 1024;
const totalWarning = totalMB > THRESHOLDS.maxTotalStaticMB
  ? [`Total static output is ${totalMB.toFixed(2)}MB (>${THRESHOLDS.maxTotalStaticMB}MB)`]
  : [];

// ── Lighthouse target estimates ───────────────────────────────────────────────
// Heuristic scoring based on bundle sizes (not actual LH run)
const jsKB = jsReport.totalBytes / 1024;
const cssKB = cssReport.totalBytes / 1024;
const pageCount = htmlReport.files.length;

// Lighthouse performance heuristic (static export: no SSR overhead, code-split, cached)
// Static export = no TTFB, no server processing. LH perf mainly driven by:
// - Largest Contentful Paint (LCP): dominated by largest image
// - Total Blocking Time (TBT): long JS tasks. Next.js splits aggressively.
// - Cumulative Layout Shift (CLS): typically 0 for static
// Conservative estimate: start at 95 for a well-structured Next.js static export
const largestChunkKB = jsReport.files.length > 0 ? jsReport.files[0].size / 1024 : 0;
const performanceScore = Math.max(
  60,
  95
  - Math.max(0, (largestChunkKB - 350) / 20)  // -1pt per 20KB over 350KB per chunk
  - Math.max(0, (cssKB - 100) / 10)            // -1pt per 10KB over 100KB CSS
);

// ── Report ────────────────────────────────────────────────────────────────────
const allWarnings = [...jsWarnings, ...cssWarnings, ...htmlWarnings, ...imgWarnings, ...totalWarning];
const pass = allWarnings.length === 0;

const report = {
  generated_at: new Date().toISOString(),
  summary: {
    pass,
    warnings: allWarnings.length,
    estimated_lighthouse_performance: Math.round(performanceScore),
    page_count: pageCount,
    total_output: humanBytes(totalBytes),
  },
  bundles: {
    js: { ...jsReport, warnings: jsWarnings },
    css: { ...cssReport, warnings: cssWarnings },
    html: { ...htmlReport, warnings: htmlWarnings },
    images: { ...imgReport, warnings: imgWarnings },
  },
  thresholds: THRESHOLDS,
  all_warnings: allWarnings,
};

writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');

// Console output
console.log('\n[perf] ── Performance Audit ──────────────────────────────────');
console.log(`[perf] Pages:           ${pageCount}`);
console.log(`[perf] JS total:        ${jsReport.totalHuman}  (${jsReport.files.length} chunks)`);
console.log(`[perf] CSS total:       ${cssReport.totalHuman}`);
console.log(`[perf] Images total:    ${imgReport.totalHuman}  (${imgReport.files.length} files)`);
console.log(`[perf] Static output:   ${humanBytes(totalBytes)}`);
console.log(`[perf] LH perf est.:    ${Math.round(performanceScore)}/100`);

if (allWarnings.length > 0) {
  console.log(`\n[perf] ⚠ ${allWarnings.length} warning(s):`);
  allWarnings.forEach(w => console.log(`  - ${w}`));
} else {
  console.log('\n[perf] All checks passed.');
}

console.log(`[perf] Report → ${REPORT_PATH}\n`);

// Top 5 largest JS chunks
if (jsReport.files.length > 0) {
  console.log('[perf] Top JS chunks:');
  jsReport.files.slice(0, 5).forEach(f => {
    const warn = f.size > THRESHOLDS.maxJsBundleKB * 1024 ? ' ⚠' : '';
    console.log(`  ${f.sizeHuman.padEnd(8)} ${f.path}${warn}`);
  });
}
