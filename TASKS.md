# Linter Report — TASKS

> Generated: 2026-04-19
> Tool: `@biomejs/biome` v2.0.0 (`biome check`)
> Config: `biome.json` — recommended rules, `noUnusedVariables: error`, `noExplicitAny: warn`
> Scope: `app/`, `lib/`, `components/`, `hooks/`, `scripts/`
> Files checked: **113**

---

## Summary

| Metric       | Count |
|--------------|------:|
| Errors       |     0 |
| Warnings     |    17 |
| Info         |     0 |
| **Total**    |  **17** |
| Auto-fixable |     1 |

The project has **zero errors**. All 17 diagnostics are warnings.

---

## Findings by Rule

| Rule | Severity | Count | Auto-fixable | Notes |
|------|----------|------:|:------------:|-------|
| `lint/suspicious/noExplicitAny` | warn | 14 | No | `any` usage disables type checking; replace with proper types or generics |
| `lint/style/noNonNullAssertion` | warn | 3 | Partial (1 of 3) | Non-null assertions (`!`) bypass null safety; use optional chaining or guards |

---

## Most Affected Files

| # | File | Warnings |
|---|------|------:|
| 1 | `app/components/KnowledgeGraph.tsx` | 16 |
| 2 | `app/components/EquipmentViz.tsx` | 1 |

All 17 warnings are concentrated in just **2 files**, both in `app/components/`.

---

## Detailed Breakdown

### `app/components/KnowledgeGraph.tsx` (16 warnings)

- **13x `noExplicitAny`** -- d3 callback parameters and generic type arguments typed as `any` (lines 70, 102, 116, 123, 124, 133, 135, 145, 149, 150, 151, 152, 153)
- **3x `noNonNullAssertion`** -- non-null assertions on `svgRef.current!` and `.parentElement!` (lines 43, 45x2). One instance at line 45 is auto-fixable (replace `!` with `?.`).

### `app/components/EquipmentViz.tsx` (1 warning)

- **1x `noExplicitAny`** -- `props: any` on `CustomDot` function (line 27)

---

## Remediation Plan

### Priority 1 — Type the d3 callbacks in KnowledgeGraph.tsx (Manual)

Replace the 13 `any` annotations in d3 force-graph callbacks with proper types derived from the `GraphNode` and `GraphLink` interfaces already defined in the file. This is the single highest-impact change (eliminates 13 of 17 warnings).

**Approach:**
1. Define `SimNode` extending `d3.SimulationNodeDatum & GraphNode`.
2. Define `SimLink` extending `d3.SimulationLinkDatum<SimNode> & GraphLink`.
3. Replace `(d: any)` with `(d: SimNode)` or `(d: SimLink)` as appropriate.
4. Type the `.drag<SVGGElement, SimNode>()` generic explicitly.
5. Remove the `as any` cast on line 116.

### Priority 2 — Remove non-null assertions in KnowledgeGraph.tsx (Partial auto-fix)

Replace the 3 non-null assertions with safe access patterns.

**Approach:**
1. Run `npx @biomejs/biome check --fix app/components/KnowledgeGraph.tsx` to apply the 1 auto-fix (line 45 `current!` to `current?.`).
2. For the remaining 2 instances, add an early-return null guard:
   ```ts
   if (!svgRef.current) return;
   const container = svgRef.current.parentElement;
   if (!container) return;
   ```

### Priority 3 — Type the CustomDot props in EquipmentViz.tsx (Manual)

Replace `props: any` with an explicit interface matching the Recharts custom dot props shape.

**Approach:**
1. Define `interface CustomDotProps { cx: number; cy: number; payload: { tier: string } }`.
2. Replace `(props: any)` with `(props: CustomDotProps)`.

---

## Auto-fix Command

To apply the single available auto-fix:

```bash
npx @biomejs/biome check --fix app/components/KnowledgeGraph.tsx
```

This will convert one `svgRef.current!.parentElement` to `svgRef.current?.parentElement` on line 45. All other warnings require manual intervention.
