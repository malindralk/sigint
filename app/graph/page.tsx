import type { Metadata } from 'next';
import { buildGraphData } from '@/lib/graph-data';
import KnowledgeGraph from '@/app/components/KnowledgeGraph';

export const metadata: Metadata = { title: 'Knowledge Graph' };

export default function GraphPage() {
  const graphData = buildGraphData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div>
        <div className="t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)', marginBottom: 'var(--space-xs)' }}>
          &gt; knowledge_graph / {graphData.nodes.length} nodes / {graphData.edges.length} edges
        </div>
        <h1 className="t-heading" style={{ color: 'var(--brand-primary)' }}>Knowledge Graph</h1>
        <p className="t-body" style={{ fontSize: '13px', marginTop: 'var(--space-xs)' }}>
          Force-directed map of all wiki articles and their cross-references. Nodes are articles; edges are explicit links.
        </p>
      </div>
      <div style={{ height: '70vh' }}>
        <KnowledgeGraph data={graphData} />
      </div>
    </div>
  );
}
