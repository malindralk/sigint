'use client';

import type { SimulationNodeDatum } from 'd3';
import { useEffect, useRef, useState } from 'react';
import { BRAND } from '@/lib/brand-colors';
import type { GraphData, GraphNode } from '@/lib/graph-data';

type SimNode = SimulationNodeDatum & GraphNode;
interface SimLink {
  source: SimNode;
  target: SimNode;
}

const CATEGORIES = [
  { key: 'all', label: 'All', color: 'var(--text-primary)' },
  { key: 'em-sca', label: 'EM-SCA', color: BRAND.primary },
  { key: 'sigint', label: 'SIGINT', color: BRAND.info },
  { key: 'reference', label: 'Reference', color: BRAND.success },
  { key: 'learning', label: 'Learning', color: BRAND.accent },
  { key: 'infrastructure', label: 'Infrastructure', color: BRAND.accent },
];

interface Props {
  data: GraphData;
}

function GraphSkeleton() {
  return (
    <div className="flex items-center justify-center" style={{ height: '100%', minHeight: '400px' }}>
      <div className="t-muted" style={{ fontFamily: 'var(--font-ui)', fontSize: '13px' }}>
        Loading knowledge graph...
      </div>
    </div>
  );
}

export default function KnowledgeGraph({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState('all');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!svgRef.current || typeof window === 'undefined') return;
    setReady(false);
    let d3: typeof import('d3');

    async function init() {
      d3 = await import('d3');
      const svgEl = svgRef.current;
      if (!svgEl) return;
      const svg = d3.select(svgEl);
      svg.selectAll('*').remove();
      const container = svgEl.parentElement;
      if (!container) return;
      const W = container.clientWidth || 800;
      const H = container.clientHeight || 600;
      svgEl.setAttribute('width', String(W));
      svgEl.setAttribute('height', String(H));

      const colorMap: Record<string, string> = {};
      CATEGORIES.forEach((c) => {
        colorMap[c.key] = c.key === 'all' ? 'var(--text-primary)' : c.color;
      });

      const filteredNodes = filter === 'all' ? data.nodes : data.nodes.filter((n) => n.category === filter);
      const filteredIds = new Set(filteredNodes.map((n) => n.id));
      const filteredEdges = data.edges.filter(
        (e) => filteredIds.has(e.source as string) && filteredIds.has(e.target as string),
      );
      const nodes = filteredNodes.map((n) => ({ ...n }));
      const links = filteredEdges.map((e) => ({ ...e }));

      const simulation = d3
        .forceSimulation<SimNode>(nodes as SimNode[])
        .force(
          'link',
          d3
            .forceLink<SimNode, SimLink>(links as unknown as SimLink[])
            .id((d) => d.id)
            .distance(100)
            .strength(0.4),
        )
        .force('charge', d3.forceManyBody().strength(-220))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide(28));

      const g = svg.append('g');
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform));
      svg.call(zoom);

      const link = g
        .append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', BRAND.borderSolid)
        .attr('stroke-width', 1.2)
        .attr('stroke-opacity', 0.4);

      const node = g
        .append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('cursor', 'pointer')
        .call(
          d3
            .drag<SVGGElement, SimNode>()
            .on('start', (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on('drag', (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on('end', (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
              // biome-ignore lint/suspicious/noExplicitAny: D3 drag type incompatible with selection.call()
            }) as any,
        )
        .on('click', (_event, d) => setSelected(d as unknown as GraphNode));

      node
        .append('circle')
        .attr('r', 14)
        .attr('fill', (d: SimNode) => `${colorMap[d.category]}22`)
        .attr('stroke', (d: SimNode) => colorMap[d.category])
        .attr('stroke-width', 1.5);

      node
        .append('text')
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', (d: SimNode) => colorMap[d.category])
        .attr('pointer-events', 'none')
        .each(function (this: SVGTextElement, d: SimNode) {
          const words = d.label.split(/[\s-]/);
          const abbr = words
            .map((w: string) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 4);
          d3.select(this).text(abbr);
        });

      node.append('title').text((d: SimNode) => d.label);

      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x ?? 0)
          .attr('y1', (d: any) => d.source.y ?? 0)
          .attr('x2', (d: any) => d.target.x ?? 0)
          .attr('y2', (d: any) => d.target.y ?? 0);
        node.attr('transform', (d: SimNode) => `translate(${d.x},${d.y})`);
      });

      setReady(true);
      return () => simulation.stop();
    }

    const cleanup = init();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [data, filter]);

  const filteredCount = filter === 'all' ? data.nodes.length : data.nodes.filter((n) => n.category === filter).length;
  const edgeCount =
    filter === 'all'
      ? data.edges.length
      : data.edges.filter((e) => {
          const ids = new Set(data.nodes.filter((n) => filter === 'all' || n.category === filter).map((n) => n.id));
          return ids.has(e.source as string) && ids.has(e.target as string);
        }).length;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Tab bar */}
      <div>
        <div className="flex items-end gap-0 border-b" style={{ borderColor: 'var(--border)' }}>
          {CATEGORIES.map((cat) => {
            const active = filter === cat.key;
            const catColor = cat.key === 'all' ? 'var(--text-primary)' : cat.color;
            return (
              <button
                type="button"
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                className="px-4 py-2.5 text-xs transition-colors relative"
                style={{
                  color: active ? catColor : 'var(--text-muted)',
                  fontWeight: active ? 600 : 400,
                  fontFamily: 'var(--font-ui)',
                  borderBottom: active ? `2px solid ${catColor}` : '2px solid transparent',
                  marginBottom: '-1px',
                }}
              >
                {cat.label}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-4 px-4 pb-2.5">
            <span className="t-muted" style={{ fontSize: '10px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{filteredCount}</span> nodes
            </span>
            <span className="t-muted" style={{ fontSize: '10px' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{edgeCount}</span> edges
            </span>
          </div>
        </div>
      </div>

      {/* Graph area */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div
          className="flex-1 overflow-hidden relative"
          style={{
            minHeight: '500px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {!ready && <GraphSkeleton />}
          <svg ref={svgRef} className="w-full h-full" style={{ display: ready ? 'block' : 'none' }} />
          <div className="absolute bottom-3 left-3 t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)' }}>
            Drag to pan · Scroll to zoom · Click node
          </div>
        </div>

        {/* Selected node panel */}
        {selected && (
          <div className="w-64 shrink-0 card" style={{ padding: 'var(--space-md)', height: 'fit-content' }}>
            <div className="t-label">SELECTED NODE</div>
            <div className="t-card-heading" style={{ fontSize: '14px', marginBottom: 'var(--space-sm)' }}>
              <span style={{ color: CATEGORIES.find((c) => c.key === selected.category)?.color }}>
                {selected.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5" style={{ marginBottom: 'var(--space-sm)' }}>
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: CATEGORIES.find((c) => c.key === selected.category)?.color }}
              />
              <span
                className="text-xs"
                style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', textTransform: 'capitalize' }}
              >
                {selected.category}
              </span>
            </div>
            {selected.description && (
              <p className="t-muted" style={{ fontSize: '12px', lineHeight: 1.5, marginBottom: 'var(--space-sm)' }}>
                {selected.description}
              </p>
            )}
            <div className="divider" style={{ margin: 'var(--space-sm) 0' }} />
            <div className="flex items-center justify-between">
              <span className="t-label" style={{ marginBottom: 0 }}>
                Connections
              </span>
              <span
                className="text-sm"
                style={{ fontFamily: 'var(--font-ui)', color: 'var(--brand-primary)', fontWeight: 600 }}
              >
                {data.edges.filter((e) => e.source === selected.id || e.target === selected.id).length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
