// MALINDRA PHASE 2
// lib/sigint.ts
// SIGINT cross-referencing system.
// Finds related signals by cosine similarity on tags + entities.
// Pure build-time utility — no client-side usage.

export interface Signal {
  slug: string;
  title: string;
  tags: string[];
  entities: string[];
  date: string;
  category: string;
  excerpt: string;
}

// ── Entity extraction ─────────────────────────────────────────────────────────
// Recognise common Sri Lankan / Laccadive Sea entities from article content.

const KNOWN_ENTITIES = [
  'CBSL',
  'IMF',
  'World Bank',
  'ADB',
  'Paris Club',
  'Sri Lanka',
  'India',
  'China',
  'Japan',
  'USA',
  'Colombo Port',
  'Hambantota',
  'Trincomalee',
  'LKR',
  'USD',
  'SDR',
  'BOC',
  'NSB',
  'CSE',
  'SLTDA',
  'CEB',
  'LECO',
  'Belt and Road',
  'BRI',
  'Quad',
  'BRICS',
];

/**
 * Extract named entities from article text using keyword matching.
 * Extendable to NER in Phase 3.
 */
export function extractEntities(text: string): string[] {
  const found: string[] = [];
  const upper = text.toUpperCase();
  for (const entity of KNOWN_ENTITIES) {
    if (upper.includes(entity.toUpperCase())) {
      found.push(entity);
    }
  }
  return [...new Set(found)];
}

// ── Similarity ────────────────────────────────────────────────────────────────

/**
 * Compute cosine similarity between two term-frequency vectors.
 */
function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const [term, countA] of vecA) {
    dot += countA * (vecB.get(term) ?? 0);
    magA += countA * countA;
  }
  for (const [, countB] of vecB) {
    magB += countB * countB;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Build a term-frequency vector from tags and entities.
 * Tags are weighted 2× over entities.
 */
function buildVector(signal: Signal): Map<string, number> {
  const vec = new Map<string, number>();
  for (const tag of signal.tags) {
    const key = tag.toLowerCase();
    vec.set(key, (vec.get(key) ?? 0) + 2);
  }
  for (const entity of signal.entities) {
    const key = entity.toLowerCase();
    vec.set(key, (vec.get(key) ?? 0) + 1);
  }
  return vec;
}

/**
 * Find the top-N related signals for a given signal.
 * Excludes self. Scores by cosine similarity on tags + entities.
 */
export function findRelatedSignals(current: Signal, all: Signal[], limit = 3): Signal[] {
  const currentVec = buildVector(current);

  const scored = all
    .filter((s) => s.slug !== current.slug)
    .map((s) => ({
      signal: s,
      score: cosineSimilarity(currentVec, buildVector(s)),
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.signal);
}

// ── Badge variant mapping ─────────────────────────────────────────────────────

const TAG_BADGE_MAP: Record<string, string> = {
  'debt restructuring': 'badge-gold',
  'digital policy': 'badge-hold',
  tourism: 'badge-buy',
  geopolitics: 'badge-hold',
  'renewable energy': 'badge-buy',
  'china-india triangulation': 'badge-gold',
  'laccadive sea': 'badge-hold',
  finance: 'badge-gold',
  infrastructure: 'badge-hold',
  'sri lanka': 'badge-hold',
};

export function getBadgeVariant(tag: string): string {
  return TAG_BADGE_MAP[tag.toLowerCase()] ?? 'badge-hold';
}
