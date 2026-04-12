import type { Metadata } from 'next';
import { buildGraphData } from '@/lib/graph-data';
import KnowledgeGraph from '@/app/components/KnowledgeGraph';

export const metadata: Metadata = { title: 'Knowledge Graph' };

export default function GraphPage() {
  const graphData = buildGraphData();

  return (
    <div className="space-y-4 h-full">
      <div>
        <div className="font-mono text-xs text-text-muted mb-1">&gt; knowledge_graph / {graphData.nodes.length} nodes / {graphData.edges.length} edges</div>
        <h1 className="text-2xl font-bold text-accent-green">Knowledge Graph</h1>
        <p className="text-text-secondary text-sm mt-1">
          Force-directed map of all wiki articles and their cross-references. Nodes are articles; edges are explicit links between them.
        </p>
      </div>
      <div style={{ height: '70vh' }}>
        <KnowledgeGraph data={graphData} />
      </div>
    </div>
  );
}
