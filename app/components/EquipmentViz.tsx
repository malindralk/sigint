'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TIER_COLORS: Record<string, string> = { entry: '#7A1E2E', mid: '#C4881E', pro: '#2C5F8A' };

const TT = {
  backgroundColor: '#131217', border: '1px solid #4A4B5459',
  borderRadius: '6px', color: '#EDE0C4', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace',
};

interface HW { name: string; price: number; bwMhz: number; adcBits: number; freqGhz: number; txCapable: boolean; tier: string }

function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  const color = TIER_COLORS[payload.tier] ?? '#6B6254';
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
    <div className="card" style={{ padding: 'var(--space-lg)' }}>
      <div className="t-label">Price vs. Bandwidth</div>
      <div className="t-muted" style={{ fontSize: '11px', marginBottom: 'var(--space-md)' }}>Circle size = ADC bit depth</div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4A4B5459" />
          <XAxis type="number" dataKey="price" name="Price" scale="log" domain={[30, 30000]}
            tick={{ fill: '#6B6254', fontSize: 10 }} axisLine={{ stroke: '#4A4B54' }}
            tickFormatter={v => v >= 1000 ? `$${v / 1000}k` : `$${v}`}
            label={{ value: 'Price (log scale)', position: 'insideBottom', offset: -10, fill: '#6B6254', fontSize: 11 }} />
          <YAxis type="number" dataKey="bwMhz" name="Bandwidth"
            tick={{ fill: '#6B6254', fontSize: 10 }} axisLine={{ stroke: '#4A4B54' }} tickFormatter={v => `${v} MS/s`} />
          <Tooltip contentStyle={TT} content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload as HW;
            return (
              <div style={TT} className="p-3 space-y-1">
                <div className="font-bold" style={{ color: TIER_COLORS[d.tier] }}>{d.name}</div>
                <div>Price: <span style={{ color: '#7A1E2E' }}>${d.price.toLocaleString()}</span></div>
                <div>Bandwidth: <span style={{ color: '#2C5F8A' }}>{d.bwMhz} MS/s</span></div>
                <div>ADC: <span style={{ color: '#C4881E' }}>{d.adcBits}-bit</span></div>
                <div>Freq: up to <span style={{ color: '#C4881E' }}>{d.freqGhz} GHz</span></div>
                <div>TX: {d.txCapable ? '✓ Full-duplex' : '✗ RX only'}</div>
              </div>
            );
          }} />
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
