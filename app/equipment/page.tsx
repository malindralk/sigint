import type { Metadata } from 'next';
import { SDR_HARDWARE } from '@/lib/viz-data';
import EquipmentViz from '@/app/components/EquipmentViz';

export const metadata: Metadata = { title: 'Equipment Comparison' };

const TIER_COLORS: Record<string, string> = { entry: '#39d353', mid: '#f0883e', pro: '#bc8cff' };
const TIER_LABELS: Record<string, string> = { entry: 'Entry (<$1k)', mid: 'Mid ($300–1.5k)', pro: 'Professional ($5k+)' };

export default function EquipmentPage() {
  return (
    <div className="space-y-8">
      <div>
        <div className="font-mono text-xs text-text-muted mb-1">&gt; equipment / sdr_comparison / {SDR_HARDWARE.length} devices</div>
        <h1 className="text-2xl font-bold text-accent-orange">Equipment Comparison</h1>
        <p className="text-text-secondary text-sm mt-1">
          SDR hardware specs — price vs. bandwidth scatter, ADC resolution, frequency range, and upgrade path.
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(TIER_LABELS).map(([tier, label]) => (
          <span key={tier} className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <span className="w-3 h-3 rounded-full" style={{ background: TIER_COLORS[tier] }} />
            {label}
          </span>
        ))}
      </div>

      {/* Interactive scatter + specs */}
      <EquipmentViz hardware={SDR_HARDWARE} />

      {/* Spec table */}
      <section className="bg-bg-secondary border border-border-default rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default">
              {['Device', 'Price', 'Freq Range', 'Bandwidth', 'ADC Bits', 'TX', 'Tier'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-mono text-text-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...SDR_HARDWARE].sort((a, b) => a.price - b.price).map(d => (
              <tr key={d.name} className="border-b border-border-muted hover:bg-bg-hover transition-colors">
                <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">{d.name}</td>
                <td className="px-4 py-3 font-mono" style={{ color: TIER_COLORS[d.tier] }}>${d.price.toLocaleString()}</td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs">
                  {d.freqGhz < 0.1 ? `${d.freqGhz * 1000}MHz` : `${d.freqGhz}GHz`}
                </td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs">{d.bwMhz} MS/s</td>
                <td className="px-4 py-3 text-text-secondary font-mono text-xs">{d.adcBits}-bit</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${d.txCapable ? 'text-accent-green bg-green-900/20' : 'text-text-muted'}`}>
                    {d.txCapable ? 'Full-duplex' : 'RX only'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: TIER_COLORS[d.tier], background: `${TIER_COLORS[d.tier]}15` }}>
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
        <div className="text-xs font-mono text-text-muted uppercase tracking-widest mb-4">/ Upgrade Path for EM-SCA</div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {[
            { label: 'RTL-SDR v4', price: '$40', note: 'SEMA, TEMPEST basics', color: '#39d353' },
            { label: '→' },
            { label: 'HackRF 2.0', price: '$600', note: 'Active EM-SCA, MIMO', color: '#f0883e' },
            { label: '→' },
            { label: 'USRP X410', price: '$18k', note: '400 MHz BW, FIPS testing', color: '#bc8cff' },
          ].map((item, i) =>
            'label' in item && item.color ? (
              <div key={i} className="bg-bg-secondary border border-border-default rounded-lg px-4 py-3 flex-1">
                <div className="font-mono text-sm font-semibold" style={{ color: item.color }}>{item.label}</div>
                <div className="font-mono text-xs text-text-muted">{item.price}</div>
                <div className="text-xs text-text-secondary mt-1">{item.note}</div>
              </div>
            ) : (
              <span key={i} className="text-text-muted text-xl font-bold hidden sm:block">→</span>
            )
          )}
        </div>
      </section>
    </div>
  );
}
