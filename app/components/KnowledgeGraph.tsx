"use client";

import { useEffect, useRef, useState } from "react";
import type { GraphData, GraphNode } from "@/lib/graph-data";

const CATEGORIES = [
  { key: "em-sca", label: "EM-SCA", color: "#7A1E2E" },
  { key: "sigint", label: "SIGINT", color: "#2C5F8A" },
  { key: "reference", label: "Reference", color: "#1E6B52" },
  { key: "learning", label: "Learning", color: "#C4881E" },
  { key: "infrastructure", label: "Infrastructure", color: "#C4881E" },
] as const;

interface Props { data: GraphData; }

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
  const [filter, setFilter] = useState("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!svgRef.current || typeof window === "undefined") return;
    setReady(false);
    let d3: typeof import("d3");

    async function init() {
      d3 = await import("d3");
      const svg = d3.select(svgRef.current!);
      svg.selectAll("*").remove();
      const container = svgRef.current!.parentElement!;
      const W = container.clientWidth || 800;
      const H = container.clientHeight || 600;
      svgRef.current!.setAttribute("width", String(W));
      svgRef.current!.setAttribute("height", String(H));

      const colorMap: Record<string, string> = {};
      CATEGORIES.forEach(c => { colorMap[c.key] = c.color; });

      const filteredNodes = filter === "all" ? data.nodes : data.nodes.filter((n) => n.category === filter);
      const filteredIds = new Set(filteredNodes.map((n) => n.id));
      const filteredEdges = data.edges.filter((e) => filteredIds.has(e.source as string) && filteredIds.has(e.target as string));
      const nodes = filteredNodes.map((n) => ({ ...n }));
      const links = filteredEdges.map((e) => ({ ...e }));

      const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
        .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100).strength(0.4))
        .force("charge", d3.forceManyBody().strength(-220))
        .force("center", d3.forceCenter(W / 2, H / 2))
        .force("collision", d3.forceCollide(28));

      const g = svg.append("g");
      const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on("zoom", (event) => g.attr("transform", event.transform));
      svg.call(zoom);

      const link = g.append("g").selectAll("line").data(links).join("line")
        .attr("stroke", "#4A4B54").attr("stroke-width", 1.2).attr("stroke-opacity", 0.4);

      const node = g.append("g").selectAll("g").data(nodes).join("g")
        .attr("cursor", "pointer")
        .call(d3.drag<SVGGElement, any>()
          .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }) as any)
        .on("click", (_event, d) => setSelected(d as unknown as GraphNode));

      node.append("circle").attr("r", 14)
        .attr("fill", (d: any) => `${colorMap[d.category]}22`)
        .attr("stroke", (d: any) => colorMap[d.category]).attr("stroke-width", 1.5);

      node.append("text").attr("dy", "0.35em").attr("text-anchor", "middle")
        .attr("font-size", "9px").attr("font-family", "JetBrains Mono, monospace")
        .attr("fill", (d: any) => colorMap[d.category]).attr("pointer-events", "none")
        .each(function(d: any) {
          const words = d.label.split(/[\s-]/);
          const abbr = words.map((w: string) => w[0]).join("").toUpperCase().slice(0, 4);
          d3.select(this).text(abbr);
        });

      node.append("title").text((d: any) => d.label);

      simulation.on("tick", () => {
        link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
          .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
        node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      });

      setReady(true);
      return () => simulation.stop();
    }

    const cleanup = init();
    return () => { cleanup.then((fn) => fn && fn()); };
  }, [data, filter]);

  const totalCount = data.nodes.length;
  const filteredCount = filter === "all" ? totalCount : data.nodes.filter(n => n.category === filter).length;
  const edgeCount = filter === "all" ? data.edges.length : data.edges.filter(e => {
    const ids = new Set(data.nodes.filter(n => filter === "all" || n.category === filter).map(n => n.id));
    return ids.has(e.source as string) && ids.has(e.target as string);
  }).length;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="t-muted" style={{ fontSize: '10px' }}>Filter</span>
          <div className="h-4" style={{ width: '1px', background: 'var(--border)' }} />

          {/* All button */}
          <button
            onClick={() => setFilter("all")}
            className="text-xs px-3 py-1 rounded-md transition-all"
            style={{
              background: filter === "all" ? 'var(--text-primary)' : 'transparent',
              color: filter === "all" ? 'var(--bg-base)' : 'var(--text-muted)',
              fontWeight: filter === "all" ? 600 : 400,
              border: `1px solid ${filter === "all" ? 'var(--text-primary)' : 'var(--border)'}`,
              fontFamily: 'var(--font-ui)',
            }}
          >
            All
          </button>

          {/* Category pills */}
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setFilter(cat.key)}
              className="text-xs px-3 py-1 rounded-md transition-all flex items-center gap-1.5"
              style={{
                background: filter === cat.key ? `${cat.color}22` : 'transparent',
                color: filter === cat.key ? cat.color : 'var(--text-muted)',
                fontWeight: filter === cat.key ? 600 : 400,
                border: `1px solid ${filter === cat.key ? cat.color : 'var(--border)'}`,
                fontFamily: 'var(--font-ui)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <span className="t-muted" style={{ fontSize: '10px' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{filteredCount}</span> nodes
          </span>
          <span className="t-muted" style={{ fontSize: '10px' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{edgeCount}</span> edges
          </span>
        </div>
      </div>

      {/* Graph area */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 overflow-hidden relative" style={{ minHeight: '500px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          {!ready && <GraphSkeleton />}
          <svg ref={svgRef} className="w-full h-full" style={{ display: ready ? "block" : "none" }} />
          <div className="absolute bottom-3 left-3 t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)' }}>
            Drag to pan · Scroll to zoom · Click node
          </div>
        </div>

        {/* Selected node panel */}
        {selected && (
          <div className="w-64 shrink-0 card" style={{ padding: 'var(--space-md)', height: 'fit-content' }}>
            <div className="t-label">SELECTED NODE</div>
            <div className="t-card-heading" style={{ fontSize: '14px', marginBottom: 'var(--space-sm)' }}>
              <span style={{ color: CATEGORIES.find(c => c.key === selected.category)?.color }}>{selected.label}</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: CATEGORIES.find(c => c.key === selected.category)?.color }} />
              <span className="text-xs" style={{ fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
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
              <span className="t-label" style={{ marginBottom: 0 }}>Connections</span>
              <span className="text-sm" style={{ fontFamily: 'var(--font-ui)', color: 'var(--brand-primary)', fontWeight: 600 }}>
                {data.edges.filter((e) => e.source === selected.id || e.target === selected.id).length}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
