"use client";

import { useEffect, useRef, useState } from "react";
import type { GraphData, GraphNode } from "@/lib/graph-data";

const COLORS: Record<string, string> = {
  "em-sca": "#7A1E2E",
  "sigint": "#2C5F8A",
  "infrastructure": "#C4881E",
  "learning": "#C4881E",
  "reference": "#1E6B52",
};

interface Props { data: GraphData; }

function GraphSkeleton() {
  return (
    <div className="flex items-center justify-center h-full min-h-[500px]">
      <div className="t-muted font-mono text-sm animate-pulse">Loading knowledge graph...</div>
    </div>
  );
}

export default function KnowledgeGraph({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [filter, setFilter] = useState<string>("all");
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
        .attr("stroke", "#4A4B54").attr("stroke-width", 1.2).attr("stroke-opacity", 0.6);

      const node = g.append("g").selectAll("g").data(nodes).join("g")
        .attr("cursor", "pointer")
        .call(d3.drag<SVGGElement, any>()
          .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }) as any)
        .on("click", (_event, d) => setSelected(d as unknown as GraphNode));

      node.append("circle").attr("r", 14)
        .attr("fill", (d: any) => `${COLORS[d.category]}22`)
        .attr("stroke", (d: any) => COLORS[d.category]).attr("stroke-width", 1.5);

      node.append("text").attr("dy", "0.35em").attr("text-anchor", "middle")
        .attr("font-size", "9px").attr("font-family", "JetBrains Mono, monospace")
        .attr("fill", (d: any) => COLORS[d.category]).attr("pointer-events", "none")
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

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="t-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-ui)' }}>Filter:</span>
        {["all", "em-sca", "sigint", "reference", "learning", "infrastructure"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-xs px-3 py-1 rounded border transition-colors font-mono"
            style={{
              borderColor: filter === f ? (COLORS[f] ?? "#EDE0C4") : "#4A4B54",
              color: filter === f ? (COLORS[f] ?? "#EDE0C4") : "#6B6254",
              background: filter === f ? `${COLORS[f] ?? "#EDE0C4"}11` : "transparent",
              fontFamily: 'var(--font-ui)',
            }}>{f}</button>
        ))}
        <div className="ml-auto flex items-center gap-4 flex-wrap">
          {Object.entries(COLORS).map(([cat, color]) => (
            <span key={cat} className="flex items-center gap-1.5 text-xs t-muted" style={{ fontFamily: 'var(--font-ui)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />{cat}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 bg-bg-secondary border border-border-default rounded-lg overflow-hidden relative min-h-[500px]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          {!ready && <GraphSkeleton />}
          <svg ref={svgRef} className="w-full h-full" style={{ display: ready ? "block" : "none" }} />
          <div className="absolute bottom-3 left-3 text-xs t-muted font-mono">Drag to pan · Scroll to zoom · Click node for details</div>
        </div>

        {selected && (
          <div className="w-64 shrink-0 card" style={{ padding: 'var(--space-md)' }}>
            <div>
              <div className="t-label">SELECTED NODE</div>
              <div className="t-card-heading" style={{ fontSize: '14px', color: COLORS[selected.category] }}>{selected.label}</div>
            </div>
            <div>
              <span className="text-xs border rounded px-2 py-0.5 font-mono" style={{ borderColor: COLORS[selected.category], color: COLORS[selected.category] }}>
                {selected.category}
              </span>
            </div>
            {selected.description && (
              <p className="t-muted" style={{ fontSize: '12px', lineHeight: 1.5, marginTop: 'var(--space-xs)' }}>{selected.description}</p>
            )}
            <div>
              <div className="t-label">CONNECTIONS</div>
              <div className="text-sm font-mono" style={{ color: '#7A1E2E' }}>
                {data.edges.filter((e) => e.source === selected.id || e.target === selected.id).length} links
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
