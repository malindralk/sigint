'use client';

import { useEffect, useRef, useState } from 'react';
import type { GraphData, GraphNode } from '@/lib/graph-data';

const COLORS: Record<string, string> = {
  'em-sca': '#39d353',
  'sigint': '#58a6ff',
  'infrastructure': '#bc8cff',
  'learning': '#f0883e',
  'reference': '#e3b341',
};

interface Props {
  data: GraphData;
}

export default function KnowledgeGraph({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!svgRef.current || typeof window === 'undefined') return;

    let d3: typeof import('d3');

    async function init() {
      d3 = await import('d3');

      const svg = d3.select(svgRef.current!);
      svg.selectAll('*').remove();

      const container = svgRef.current!.parentElement!;
      const W = container.clientWidth || 800;
      const H = container.clientHeight || 600;

      svgRef.current!.setAttribute('width', String(W));
      svgRef.current!.setAttribute('height', String(H));

      const filteredNodes = filter === 'all'
        ? data.nodes
        : data.nodes.filter(n => n.category === filter);
      const filteredIds = new Set(filteredNodes.map(n => n.id));
      const filteredEdges = data.edges.filter(
        e => filteredIds.has(e.source as string) && filteredIds.has(e.target as string)
      );

      // Clone for d3 mutation
      const nodes = filteredNodes.map(n => ({ ...n }));
      const links = filteredEdges.map(e => ({ ...e }));

      const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100).strength(0.4))
        .force('charge', d3.forceManyBody().strength(-220))
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('collision', d3.forceCollide(28));

      const g = svg.append('g');

      // Zoom
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on('zoom', (event) => g.attr('transform', event.transform));
      svg.call(zoom);

      // Edges
      const link = g.append('g')
        .selectAll('line')
        .data(links)
        .join('line')
        .attr('stroke', '#30363d')
        .attr('stroke-width', 1.2)
        .attr('stroke-opacity', 0.6);

      // Nodes
      const node = g.append('g')
        .selectAll('g')
        .data(nodes)
        .join('g')
        .attr('cursor', 'pointer')
        .call(
          d3.drag<SVGGElement, any>()
            .on('start', (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x; d.fy = d.y;
            })
            .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on('end', (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null; d.fy = null;
            }) as any
        )
        .on('click', (_event, d) => setSelected(d as unknown as GraphNode));

      node.append('circle')
        .attr('r', 14)
        .attr('fill', (d: any) => `${COLORS[d.category]}22`)
        .attr('stroke', (d: any) => COLORS[d.category])
        .attr('stroke-width', 1.5);

      node.append('text')
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'JetBrains Mono, monospace')
        .attr('fill', (d: any) => COLORS[d.category])
        .attr('pointer-events', 'none')
        .text((d: any) => d.label.split(' ').slice(0, 2).join('\n').slice(0, 8) + '…')
        .each(function(d: any) {
          const words = d.label.split(/[\s-]/);
          const abbr = words.map((w: string) => w[0]).join('').toUpperCase().slice(0, 4);
          d3.select(this).text(abbr);
        });

      // Labels on hover (title)
      node.append('title').text((d: any) => d.label);

      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);
        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });

      return () => simulation.stop();
    }

    const cleanup = init();
    return () => { cleanup.then(fn => fn && fn()); };
  }, [data, filter]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-text-muted font-mono">Filter:</span>
        {['all', 'em-sca', 'sigint', 'reference', 'learning', 'infrastructure'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1 rounded border transition-colors font-mono"
            style={{
              borderColor: filter === f ? (COLORS[f] ?? '#e6edf3') : '#30363d',
              color: filter === f ? (COLORS[f] ?? '#e6edf3') : '#6e7681',
              background: filter === f ? `${COLORS[f] ?? '#e6edf3'}11` : 'transparent',
            }}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4 flex-wrap">
          {Object.entries(COLORS).map(([cat, color]) => (
            <span key={cat} className="flex items-center gap-1.5 text-xs text-text-muted font-mono">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Graph */}
        <div className="flex-1 bg-bg-secondary border border-border-default rounded-lg overflow-hidden relative min-h-[500px]">
          <svg ref={svgRef} className="w-full h-full" />
          <div className="absolute bottom-3 left-3 text-xs text-text-muted font-mono">
            Drag to pan · Scroll to zoom · Click node for details
          </div>
        </div>

        {/* Node detail panel */}
        {selected && (
          <div className="w-64 shrink-0 bg-bg-secondary border border-border-default rounded-lg p-4 space-y-3">
            <div>
              <div className="text-xs font-mono text-text-muted mb-1">SELECTED NODE</div>
              <div className="font-semibold text-text-primary text-sm leading-snug" style={{ color: COLORS[selected.category] }}>
                {selected.label}
              </div>
            </div>
            <div>
              <span className="inline-block text-xs border rounded px-2 py-0.5 font-mono"
                style={{ borderColor: COLORS[selected.category], color: COLORS[selected.category] }}>
                {selected.category}
              </span>
            </div>
            {selected.description && (
              <p className="text-text-secondary text-xs leading-relaxed">{selected.description}</p>
            )}
            <div>
              <div className="text-xs font-mono text-text-muted mb-1">CONNECTIONS</div>
              <div className="text-sm font-mono text-accent-green">
                {data.edges.filter(e =>
                  e.source === selected.id || e.target === selected.id
                ).length} links
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
