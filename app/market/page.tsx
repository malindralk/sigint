import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { COMPANIES, EMSCA_GEOGRAPHY, EMSCA_SEGMENTS } from '@/lib/viz-data';

const MarketGrowthChart = dynamic(() =>
  import('@/app/components/MarketCharts').then((m) => ({ default: m.MarketGrowthChart })),
);
const SegmentPieChart = dynamic(() =>
  import('@/app/components/MarketCharts').then((m) => ({ default: m.SegmentPieChart })),
);
const CompanyRevenueChart = dynamic(() =>
  import('@/app/components/MarketCharts').then((m) => ({ default: m.CompanyRevenueChart })),
);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <div>
        <div
          className="t-muted"
          style={{ fontSize: '10px', fontFamily: 'var(--font-ui)', marginBottom: 'var(--space-xs)' }}
        >
          &gt; market_intelligence / 2026
        </div>
        <h1 className="t-heading" style={{ color: 'var(--info)' }}>
          Market Intelligence
        </h1>
        <p className="t-body" style={{ fontSize: '13px', marginTop: 'var(--space-xs)' }}>
          EM-SCA and private SIGINT market analysis — growth projections, segment breakdown, and competitor revenue.
        </p>
      </div>

      {/* Market growth */}
      <section className="card" style={{ padding: 'var(--space-lg)' }}>
        <div className="t-label">Market Growth 2022–2035</div>
        <div className="t-muted" style={{ fontSize: '12px', marginBottom: 'var(--space-md)' }}>
          EM-SCA (left axis, $M) vs. Private SIGINT (right axis, $B)
        </div>
        <MarketGrowthChart />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginTop: 'var(--space-md)' }}>
          <div className="card" style={{ padding: 'var(--space-sm)' }}>
            <div className="t-stat" style={{ fontSize: '20px', color: 'var(--success)' }}>
              12–18% CAGR
            </div>
            <div className="card-sub">EM-SCA market</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-sm)' }}>
            <div className="t-stat" style={{ fontSize: '20px', color: 'var(--info)' }}>
              ~8% CAGR
            </div>
            <div className="card-sub">Private SIGINT market</div>
          </div>
        </div>
      </section>

      {/* Segment and geography pies */}
      <section className="grid sm:grid-cols-2 gap-3">
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <SegmentPieChart data={EMSCA_SEGMENTS} title="EM-SCA Market by Segment" />
        </div>
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <SegmentPieChart data={EMSCA_GEOGRAPHY} title="EM-SCA Market by Geography" />
        </div>
      </section>

      {/* Company revenue */}
      <section className="card" style={{ padding: 'var(--space-lg)' }}>
        <div className="t-label">Company Revenue Comparison</div>
        <div
          className="t-muted flex flex-wrap gap-x-4 gap-y-1"
          style={{ fontSize: '12px', marginBottom: 'var(--space-md)' }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--info)' }} />
            SIGINT Defense
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-primary)' }} />
            EM-SCA Vendors
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-accent)' }} />
            Space SIGINT
          </span>
        </div>
        <CompanyRevenueChart companies={COMPANIES} />
      </section>

      {/* Regulatory drivers */}
      <section>
        <div className="t-eyebrow">/ Regulatory Growth Drivers</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" style={{ marginTop: 'var(--space-sm)' }}>
          {drivers.map((d) => (
            <div key={d.label} className="card" style={{ padding: 'var(--space-sm)' }}>
              <div
                className="t-card-heading"
                style={{ fontSize: '13px', color: 'var(--brand-accent)', marginBottom: 'var(--space-xs)' }}
              >
                {d.label}
              </div>
              <div className="t-muted" style={{ fontSize: '11px', lineHeight: 1.5 }}>
                {d.desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
