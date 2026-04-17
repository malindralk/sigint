import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { SDR_HARDWARE } from '@/lib/viz-data';

const EquipmentViz = dynamic(() => import('@/app/components/EquipmentViz'));

export const metadata: Metadata = { title: 'Equipment Comparison' };

const TIER_COLORS: Record<string, string> = { entry: 'var(--brand-primary)', mid: 'var(--brand-accent)', pro: 'var(--info)' };
const TIER_LABELS: Record<string, string> = { entry: 'Entry (<$1k)', mid: 'Mid ($300–1.5k)', pro: 'Professional ($5k+)' };

export default function EquipmentPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      <div>
        <div className="t-muted" style={{ fontSize: '10px', fontFamily: 'var(--font-ui)', marginBottom: 'var(--space-xs)' }}>&gt; equipment / sdr_comparison / {SDR_HARDWARE.length} devices</div>
        <h1 className="t-heading" style={{ color: 'var(--brand-accent)' }}>Equipment Comparison</h1>
        <p className="t-body" style={{ fontSize: '13px', marginTop: 'var(--space-xs)' }}>
          SDR hardware specs — price vs. bandwidth scatter, ADC resolution, frequency range, and upgrade path.
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(TIER_LABELS).map(([tier, label]) => (
          <span key={tier} className="flex items-center gap-2 text-xs t-muted" style={{ fontFamily: 'var(--font-ui)' }}>
            <span className="w-3 h-3 rounded-full" style={{ background: TIER_COLORS[tier] }} />
            {label}
          </span>
        ))}
      </div>

      {/* Interactive scatter + specs */}
      <EquipmentViz hardware={SDR_HARDWARE} />

      {/* Spec table */}
      <section className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
              {['Device', 'Price', 'Freq Range', 'Bandwidth', 'ADC Bits', 'TX', 'Tier'].map(h => (
                <th key={h} className="text-left t-label" style={{ padding: 'var(--space-sm) var(--space-md)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...SDR_HARDWARE].sort((a, b) => a.price - b.price).map(d => (
              <tr key={d.name} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'var(--border)' }}>
                <td className="text-left" style={{ padding: 'var(--space-sm) var(--space-md)', whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--text-primary)' }}>{d.name}</td>
                <td className="text-left t-muted" style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', fontSize: '12px', color: TIER_COLORS[d.tier] }}>${d.price.toLocaleString()}</td>
                <td className="text-left t-muted" style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', fontSize: '12px' }}>
                  {d.freqGhz < 0.1 ? `${d.freqGhz * 1000}MHz` : `${d.freqGhz}GHz`}
                </td>
                <td className="text-left t-muted" style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', fontSize: '12px' }}>{d.bwMhz} MS/s</td>
                <td className="text-left t-muted" style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap', fontSize: '12px' }}>{d.adcBits}-bit</td>
                <td className="text-left" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                  <span className="text-xs" style={{ fontFamily: 'var(--font-ui)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', color: d.txCapable ? 'var(--success)' : 'var(--text-muted)', background: d.txCapable ? 'rgba(30,107,82,0.15)' : 'transparent' }}>
                    {d.txCapable ? 'Full-duplex' : 'RX only'}
                  </span>
                </td>
                <td className="text-left" style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                  <span className="text-xs" style={{ fontFamily: 'var(--font-ui)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', color: TIER_COLORS[d.tier], background: `${TIER_COLORS[d.tier]}15` }}>
                    {d.tier}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Upgrade path */}
      <section>
        <div className="t-eyebrow">/ Upgrade Path for EM-SCA</div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2" style={{ marginTop: 'var(--space-sm)' }}>
          {[
            { label: 'RTL-SDR v4', price: '$40', note: 'SEMA, TEMPEST basics', color: 'var(--brand-primary)' },
            { label: '→' },
            { label: 'HackRF 2.0', price: '$600', note: 'Active EM-SCA, MIMO', color: 'var(--brand-accent)' },
            { label: '→' },
            { label: 'USRP X410', price: '$18k', note: '400 MHz BW, FIPS testing', color: 'var(--info)' },
          ].map((item, i) =>
            'note' in item ? (
              <div key={i} className="card" style={{ padding: 'var(--space-sm)', flex: 1 }}>
                <div className="t-card-heading" style={{ fontSize: '13px', color: item.color }}>{item.label}</div>
                <div className="t-muted" style={{ fontSize: '11px', fontFamily: 'var(--font-ui)' }}>{item.price}</div>
                <div className="t-muted" style={{ fontSize: '11px', marginTop: 'var(--space-xs)' }}>{item.note}</div>
              </div>
            ) : (
              <span key={i} className="t-muted text-xl font-bold hidden sm:block" style={{ color: 'var(--text-muted)' }}>→</span>
            )
          )}
        </div>
      </section>
    </div>
  );
}
