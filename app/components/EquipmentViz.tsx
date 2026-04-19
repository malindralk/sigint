'use client';

import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { BRAND } from '@/lib/brand-colors';

const TIER_COLORS: Record<string, string> = { entry: BRAND.primary, mid: BRAND.accent, pro: BRAND.info };

const TT: React.CSSProperties = {
  backgroundColor: 'var(--theme-bg-surface)',
  border: '1px solid var(--theme-border)',
  borderRadius: '6px',
  color: 'var(--theme-text-primary)',
  fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
};

interface HW {
  name: string;
  price: number;
  bwMhz: number;
  adcBits: number;
  freqGhz: number;
  txCapable: boolean;
  tier: string;
}

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: HW;
}

function CustomDot(props: CustomDotProps) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  const color = TIER_COLORS[payload.tier] ?? BRAND.textMuted;
  return (
    <g>
      <circle cx={cx} cy={cy} r={payload.adcBits * 1.1} fill={`${color}33`} stroke={color} strokeWidth={1.5} />
      <text
        x={cx}
        y={cy - payload.adcBits * 1.1 - 4}
        textAnchor="middle"
        fill={color}
        fontSize={10}
        fontFamily="JetBrains Mono, monospace"
      >
        {payload.name.split(' ')[0]}
      </text>
    </g>
  );
}

export default function EquipmentViz({ hardware }: { hardware: HW[] }) {
  return (
    <div className="card" style={{ padding: 'var(--space-lg)' }}>
      <div className="t-label">Price vs. Bandwidth</div>
      <div className="t-muted" style={{ fontSize: '11px', marginBottom: 'var(--space-md)' }}>
        Circle size = ADC bit depth
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={BRAND.border} />
          <XAxis
            type="number"
            dataKey="price"
            name="Price"
            scale="log"
            domain={[30, 30000]}
            tick={{ fill: BRAND.textMuted, fontSize: 10 }}
            axisLine={{ stroke: BRAND.borderSolid }}
            tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
            label={{
              value: 'Price (log scale)',
              position: 'insideBottom',
              offset: -10,
              fill: BRAND.textMuted,
              fontSize: 11,
            }}
          />
          <YAxis
            type="number"
            dataKey="bwMhz"
            name="Bandwidth"
            tick={{ fill: BRAND.textMuted, fontSize: 10 }}
            axisLine={{ stroke: BRAND.borderSolid }}
            tickFormatter={(v) => `${v} MS/s`}
          />
          <Tooltip
            contentStyle={TT}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as HW;
              return (
                <div style={TT} className="p-3 space-y-1">
                  <div className="font-bold" style={{ color: TIER_COLORS[d.tier] }}>
                    {d.name}
                  </div>
                  <div>
                    Price: <span style={{ color: BRAND.primary }}>${d.price.toLocaleString()}</span>
                  </div>
                  <div>
                    Bandwidth: <span style={{ color: BRAND.info }}>{d.bwMhz} MS/s</span>
                  </div>
                  <div>
                    ADC: <span style={{ color: BRAND.accent }}>{d.adcBits}-bit</span>
                  </div>
                  <div>
                    Freq: up to <span style={{ color: BRAND.accent }}>{d.freqGhz} GHz</span>
                  </div>
                  <div>TX: {d.txCapable ? '✓ Full-duplex' : '✗ RX only'}</div>
                </div>
              );
            }}
          />
          <Scatter data={hardware} shape={<CustomDot />}>
            {hardware.map((entry) => (
              <Cell key={entry.name} fill={TIER_COLORS[entry.tier]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
