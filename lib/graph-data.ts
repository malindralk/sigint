import fs from 'node:fs';
import path from 'node:path';

export interface GraphNode {
  id: string;
  label: string;
  category: 'em-sca' | 'sigint' | 'infrastructure' | 'learning' | 'reference';
  group: number;
  description: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const GROUP_MAP: Record<GraphNode['category'], number> = {
  'em-sca': 1,
  sigint: 2,
  learning: 3,
  infrastructure: 4,
  reference: 5,
};

function extractTitle(content: string, slug: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].replace(/[*_`]/g, '').trim().slice(0, 60);
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractDescription(content: string): string {
  const lines = content
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('!'));
  return (
    lines[0]
      ?.replace(/[*_`[\]]/g, '')
      .trim()
      .slice(0, 120) || ''
  );
}

function extractLinks(content: string): string[] {
  const linkRegex = /\[([^\]]+)\]\(([^)#\s]+\.md)\)/g;
  const links: string[] = [];
  let match: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((match = linkRegex.exec(content)) !== null) {
    const target = match[2].replace(/^\.\//, '').replace(/\.md$/, '');
    links.push(target);
  }
  return [...new Set(links)];
}

export function buildGraphData(): GraphData {
  const contentDir = path.join(process.cwd(), 'content');

  if (!fs.existsSync(contentDir)) {
    console.error(
      '[graph-data] Content directory not found:',
      contentDir,
      '— ensure the content git submodule is initialized.',
    );
    return { nodes: [], edges: [] };
  }

  const nodes: GraphNode[] = [];
  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];
  const fileContents: Record<string, string> = {};
  const knownSlugs = new Set<string>();

  let categories: string[];
  try {
    categories = fs.readdirSync(contentDir).filter((d) => fs.statSync(path.join(contentDir, d)).isDirectory());
  } catch (err) {
    console.error('[graph-data] Failed to read content directory:', err);
    return { nodes: [], edges: [] };
  }

  for (const cat of categories) {
    const catDir = path.join(contentDir, cat);
    let files: string[];
    try {
      files = fs.readdirSync(catDir).filter((f) => f.endsWith('.md'));
    } catch (err) {
      console.error('[graph-data] Failed to read directory', catDir, ':', err);
      continue;
    }
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      try {
        const content = fs.readFileSync(path.join(catDir, file), 'utf-8');
        fileContents[slug] = content;
        knownSlugs.add(slug);
      } catch (err) {
        console.error('[graph-data] Failed to read file', file, ':', err);
      }
    }
  }

  // Build a slug → category map once from the already-collected fileContents keys
  // to avoid repeated readdirSync calls inside the per-node loop.
  const slugToCategory = new Map<string, GraphNode['category']>();
  for (const cat of categories) {
    const catDir = path.join(contentDir, cat);
    let files: string[];
    try {
      files = fs.readdirSync(catDir).filter((f) => f.endsWith('.md'));
    } catch {
      continue;
    }
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      let category: GraphNode['category'] = 'em-sca';
      if (cat === 'sigint') category = 'sigint';
      else if (cat === 'learning') category = 'learning';
      else if (cat === 'em-sca') {
        category = slug === 'contacts' || slug === 'organizations' ? 'reference' : 'em-sca';
      }
      slugToCategory.set(slug, category);
    }
  }

  // Build nodes — category derived from pre-built map (no inner readdirSync)
  for (const [slug, content] of Object.entries(fileContents)) {
    const category: GraphNode['category'] = slugToCategory.get(slug) ?? 'em-sca';

    nodes.push({
      id: slug,
      label: extractTitle(content, slug),
      category,
      group: GROUP_MAP[category],
      description: extractDescription(content),
    });
  }

  // Build edges (only between known nodes)
  for (const [slug, content] of Object.entries(fileContents)) {
    const links = extractLinks(content);
    for (const target of links) {
      if (knownSlugs.has(target) && target !== slug) {
        const key = [slug, target].sort().join('->');
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ source: slug, target });
        }
      }
    }
  }

  return { nodes, edges };
}
