'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SDR_HARDWARE } from '@/lib/viz-data';

const TIER_COLORS: Record<string, string> = { entry: '#39d353', mid: '#f0883e', pro: '#bc8cff' };

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1117',
  border: '1px solid #30363d',
  borderRadius: '6px',
  color: '#e6edf3',
  fontSize: '12px',
  fontFamily: 'JetBrains Mono, monospace',
};

interface HW { name: string; price: number; bwMhz: number; adcBits: number; freqGhz: number; txCapable: boolean; tier: string }

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  const color = TIER_COLORS[payload.tier] ?? '#8b949e';
  return (
    <g>
      <circle cx={cx} cy={cy} r={payload.adcBits * 1.1} fill={`${color}33`} stroke={color} strokeWidth={1.5} />
      <text x={cx} y={cy - payload.adcBits * 1.1 - 4} textAnchor="middle" fill={color} fontSize={10} fontFamily="JetBrains Mono, monospace">
        {payload.name.split(' ')[0]}
      </text>
    </g>
  );
}

export default function EquipmentViz({ hardware }: { hardware: HW[] }) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
      <div className="text-xs font-mono text-text-muted uppercase tracking-wide mb-1">Price vs. Bandwidth</div>
      <div className="text-xs text-text-muted mb-4">Circle size = ADC bit depth</div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
          <XAxis
            type="number" dataKey="price" name="Price"
            scale="log" domain={[30, 30000]}
            tick={{ fill: '#6e7681', fontSize: 10 }}
            axisLine={{ stroke: '#30363d' }}
            tickFormatter={v => v >= 1000 ? `$${v / 1000}k` : `$${v}`}
            label={{ value: 'Price (log scale)', position: 'insideBottom', offset: -10, fill: '#6e7681', fontSize: 11 }}
          />
          <YAxis
            type="number" dataKey="bwMhz" name="Bandwidth"
            tick={{ fill: '#6e7681', fontSize: 10 }}
            axisLine={{ stroke: '#30363d' }}
            tickFormatter={v => `${v} MS/s`}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload as HW;
              return (
                <div style={TOOLTIP_STYLE} className="p-3 space-y-1">
                  <div className="font-bold" style={{ color: TIER_COLORS[d.tier] }}>{d.name}</div>
                  <div>Price: <span className="text-accent-green">${d.price.toLocaleString()}</span></div>
                  <div>Bandwidth: <span className="text-accent-cyan">{d.bwMhz} MS/s</span></div>
                  <div>ADC: <span className="text-accent-orange">{d.adcBits}-bit</span></div>
                  <div>Freq: up to <span className="text-accent-purple">{d.freqGhz} GHz</span></div>
                  <div>TX: {d.txCapable ? '✓ Full-duplex' : '✗ RX only'}</div>
                </div>
              );
            }}
          />
          <Scatter data={hardware} shape={<CustomDot />}>
            {hardware.map((entry, i) => (
              <Cell key={i} fill={TIER_COLORS[entry.tier]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
