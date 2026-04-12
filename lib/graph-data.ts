import fs from 'fs';
import path from 'path';

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

const CATEGORY_MAP: Record<string, GraphNode['category']> = {
  'electromagnetic-side-channel-analysis': 'em-sca',
  'electromagnetic-side-channel-practical-guide': 'em-sca',
  'tempest-standards-reference': 'em-sca',
  'pqc-em-sca': 'em-sca',
  'entry-level-em-sca-setup': 'em-sca',
  'research-grade-em-sca-lab': 'em-sca',
  'professional-em-sca-facility': 'em-sca',
  'em-sca-market-analysis-overview': 'em-sca',
  'em-sca-key-players-companies': 'em-sca',
  'em-sca-consumer-applications': 'em-sca',
  'em-sca-index': 'em-sca',
  'em-sca-2026-developments': 'em-sca',
  'pqc-implementation-security-2026': 'em-sca',
  'sdr-tools-landscape-2026': 'em-sca',
  'contacts': 'reference',
  'organizations': 'reference',
  'sigint-academic-research-overview': 'sigint',
  'sigint-private-companies-em-intelligence': 'sigint',
  'rf-fingerprinting-device-identification': 'sigint',
  'sigint-machine-learning-pipeline': 'sigint',
  'coursera-sigint': 'learning',
  'proxmox-homelab': 'infrastructure',
  'community-scripts-org': 'infrastructure',
  'malindra-lxc-setup': 'infrastructure',
};

const GROUP_MAP: Record<GraphNode['category'], number> = {
  'em-sca': 1,
  'sigint': 2,
  'learning': 3,
  'infrastructure': 4,
  'reference': 5,
};

function extractTitle(content: string, slug: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].replace(/[*_`]/g, '').trim().slice(0, 60);
  return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function extractDescription(content: string): string {
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('!'));
  return lines[0]?.replace(/[*_`[\]]/g, '').trim().slice(0, 120) || '';
}

function extractLinks(content: string): string[] {
  const linkRegex = /\[([^\]]+)\]\(([^)#\s]+\.md)\)/g;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const target = match[2].replace(/^\.\//, '').replace(/\.md$/, '');
    links.push(target);
  }
  return [...new Set(links)];
}

export function buildGraphData(): GraphData {
  const contentDir = path.join(process.cwd(), 'content');
  const nodes: GraphNode[] = [];
  const edgeSet = new Set<string>();
  const edges: GraphEdge[] = [];
  const fileContents: Record<string, string> = {};
  const knownSlugs = new Set<string>();

  // Collect all files
  const categories = fs.readdirSync(contentDir).filter(d =>
    fs.statSync(path.join(contentDir, d)).isDirectory()
  );

  for (const cat of categories) {
    const files = fs.readdirSync(path.join(contentDir, cat)).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      const content = fs.readFileSync(path.join(contentDir, cat, file), 'utf-8');
      fileContents[slug] = content;
      knownSlugs.add(slug);
    }
  }

  // Build nodes
  for (const [slug, content] of Object.entries(fileContents)) {
    const category = CATEGORY_MAP[slug] ?? 'em-sca';
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
