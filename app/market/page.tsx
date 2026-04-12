import type { Metadata } from 'next';
import { EMSCA_SEGMENTS, EMSCA_GEOGRAPHY, COMPANIES } from '@/lib/viz-data';
import { MarketGrowthChart, SegmentPieChart, CompanyRevenueChart } from '@/app/components/MarketCharts';

export const metadata: Metadata = { title: 'Market Intelligence' };

const drivers = [
  { label: 'UN R155', desc: 'Automotive cybersecurity mandate (all new vehicles 2024+)' },
  { label: 'NIST PQC', desc: 'FIPS 203/204/205 — forces PQC evaluation & SCA testing' },
  { label: 'ETSI EN 303 645', desc: 'IoT security baseline — 13 provisions requiring hardware validation' },
  { label: 'CHIPS Act', desc: '$52.7B US semiconductor investment driving domestic SCA testing' },
  { label: 'FIPS 140-3', desc: 'Updated EM requirements for all federal cryptographic modules' },
  { label: 'Common Criteria', desc: 'EAL5+ certifications require SCA resistance evaluation' },
];

export default function MarketPage() {
  return (
    <div className="space-y-10">
      <div>
        <div className="font-mono text-xs text-text-muted mb-1">&gt; market_intelligence / 2026</div>
        <h1 className="text-2xl font-bold text-accent-cyan">Market Intelligence</h1>
        <p className="text-text-secondary text-sm mt-1">
          EM-SCA and private SIGINT market analysis — growth projections, segment breakdown, and competitor revenue.
        </p>
      </div>

      {/* Market growth area chart */}
      <section className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <div className="text-xs font-mono text-text-muted uppercase tracking-wide mb-1">Market Growth 2022–2035</div>
        <div className="text-sm text-text-secondary mb-6">EM-SCA (left axis, $M) vs. Private SIGINT (right axis, $B)</div>
        <MarketGrowthChart />
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="border border-border-muted rounded-lg p-3">
            <div className="text-accent-green font-mono font-bold">12–18% CAGR</div>
            <div className="text-text-muted text-xs mt-0.5">EM-SCA market</div>
          </div>
          <div className="border border-border-muted rounded-lg p-3">
            <div className="text-accent-cyan font-mono font-bold">~8% CAGR</div>
            <div className="text-text-muted text-xs mt-0.5">Private SIGINT market</div>
          </div>
        </div>
      </section>

      {/* Segment and geography pies */}
      <section className="grid sm:grid-cols-2 gap-4">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <SegmentPieChart data={EMSCA_SEGMENTS} title="EM-SCA Market by Segment" />
        </div>
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <SegmentPieChart data={EMSCA_GEOGRAPHY} title="EM-SCA Market by Geography" />
        </div>
      </section>

      {/* Company revenue */}
      <section className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <div className="text-xs font-mono text-text-muted uppercase tracking-wide mb-1">Company Revenue Comparison</div>
        <div className="text-sm text-text-secondary mb-6">
          <span className="inline-flex items-center gap-1.5 mr-4"><span className="w-2 h-2 rounded-full bg-accent-cyan" />SIGINT Defense</span>
          <span className="inline-flex items-center gap-1.5 mr-4"><span className="w-2 h-2 rounded-full bg-accent-green" />EM-SCA Vendors</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-purple" />Space SIGINT</span>
        </div>
        <CompanyRevenueChart companies={COMPANIES} />
      </section>

      {/* Regulatory drivers */}
      <section>
        <div className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">/ Regulatory Growth Drivers</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map(d => (
            <div key={d.label} className="bg-bg-secondary border border-border-default rounded-lg p-4">
              <div className="font-mono text-accent-orange text-sm font-semibold mb-1">{d.label}</div>
              <div className="text-text-secondary text-xs leading-relaxed">{d.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
