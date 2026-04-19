// MALINDRA PHASE 1
// lib/markdown.ts
// Processes raw markdown → HTML with SIGINT block injection.
// [Signal] → gold accent card
// [Context] → blue accent card
// [Implication] → green accent card
// [Action] → maroon accent card
// [FACT] / [ANALYSIS] → inline label badges

import matter from 'gray-matter';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

// Permissive sanitize schema: allows classes, data attributes, and common HTML
// but strips script tags and event handlers (onclick, onerror, etc.)
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'class', 'style', /^data-/],
    div: [...(defaultSchema.attributes?.div || []), 'className', 'class', 'style'],
    span: [...(defaultSchema.attributes?.span || []), 'className', 'class', 'style'],
    code: [...(defaultSchema.attributes?.code || []), 'className', 'class'],
    pre: [...(defaultSchema.attributes?.pre || []), 'className', 'class'],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'div',
    'span',
    'section',
    'article',
    'aside',
    'details',
    'summary',
    'figure',
    'figcaption',
    'mark',
    'time',
    'abbr',
    'cite',
  ],
};

// ── SIGINT block transformer ─────────────────────────────────────────────────
// Converts fenced block syntax:
//   > [Signal] ...text...
//   > [Context] ...text...
// into styled HTML divs using .brand/ card classes.

const SIGINT_BLOCKS: Record<string, { label: string; accent: string; color: string }> = {
  Signal: { label: 'SIGNAL', accent: 'card-accent-gold', color: 'var(--color-temple-gold)' },
  Context: { label: 'CONTEXT', accent: 'card-accent-blue', color: 'var(--color-zheng-he)' },
  Implication: { label: 'IMPLICATION', accent: 'card-accent-green', color: 'var(--color-water-fortress)' },
  Action: { label: 'ACTION', accent: 'card-accent-maroon', color: 'var(--color-sinha-maroon)' },
};

// Label badge colors — use CSS variables only, no raw hex
const LABEL_BADGES: Record<string, { bg: string; color: string }> = {
  FACT: { bg: 'color-mix(in srgb, var(--color-zheng-he) 15%, transparent)', color: 'var(--color-zheng-he)' },
  ANALYSIS: { bg: 'color-mix(in srgb, var(--color-temple-gold) 15%, transparent)', color: 'var(--color-temple-gold)' },
};

/**
 * Pre-process raw markdown:
 * 1. Expand [Signal]/[Context]/[Implication]/[Action] blocks
 * 2. Inject [FACT] / [ANALYSIS] inline labels
 */
function preprocessMarkdown(raw: string): string {
  const { content } = matter(raw);

  // Transform blockquotes starting with [BlockType]:
  //   > [Signal] This is the raw signal text.
  // → custom HTML div
  let processed = content.replace(
    /^>\s*\[(\w+)\]\s*([\s\S]*?)(?=\n\n|\n>|\n#|$)/gm,
    (_, blockType: string, text: string) => {
      const block = SIGINT_BLOCKS[blockType];
      if (!block) return _; // unknown block, leave as-is
      const body = text.trim().replace(/\n> ?/g, '\n');
      return `<div class="card sigint-block" data-sigint="${blockType.toLowerCase()}" style="margin: var(--spacing-lg) 0;">
  <div class="card-accent ${block.accent}"></div>
  <div class="t-label" style="color: ${block.color}; margin-bottom: var(--spacing-sm);">${block.label}</div>
  <div class="t-body" style="margin: 0;">${body}</div>
</div>`;
    },
  );

  // Transform inline [FACT] and [ANALYSIS] markers
  processed = processed.replace(/\[(\bFACT\b|\bANALYSIS\b)\]/g, (_, label: string) => {
    const badge = LABEL_BADGES[label];
    if (!badge) return _;
    return `<span style="display: inline-flex; align-items: center; font-family: var(--font-ui); font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 2px 7px; border-radius: var(--radius-sm); margin-right: 4px; background: ${badge.bg}; color: ${badge.color};">${label}</span>`;
  });

  return processed;
}

/**
 * Parse markdown into heading structure for Table of Contents.
 */
export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractToc(markdown: string): TocItem[] {
  const { content } = matter(markdown);
  const items: TocItem[] = [];
  const regex = /^(#{1,3})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    items.push({ id, level, text });
  }
  return items;
}

/**
 * Convert raw markdown (with SIGINT blocks) to HTML string.
 */
export async function markdownToHtml(rawMarkdown: string): Promise<string> {
  const preprocessed = preprocessMarkdown(rawMarkdown);

  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize, sanitizeSchema as typeof defaultSchema)
    .use(rehypeStringify)
    .process(preprocessed);

  return String(result);
}
