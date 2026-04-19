// MALINDRA PHASE 3
// components/StaticChart.tsx
// Loads pre-rendered SVG chart at build time (img tag for static export).
// Adds CSS hover tooltip overlays. Uses brand token colors only.
// Server component — no 'use client' needed.

interface ChartTooltip {
  x: string; // CSS left %
  y: string; // CSS top %
  label: string;
}

interface StaticChartProps {
  /** Path relative to /public, e.g. /charts/tag-distribution.svg */
  src: string;
  title: string;
  description?: string;
  tooltips?: ChartTooltip[];
  width?: number;
  height?: number;
  locale?: 'en' | 'si';
}

export default function StaticChart({
  src,
  title,
  description,
  tooltips = [],
  width = 560,
  height = 280,
  locale = 'en',
}: StaticChartProps) {
  return (
    <figure
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: `${width}px`,
        margin: '0 auto',
      }}
      aria-label={title}
    >
      {/* Chart container */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-default)',
          overflow: 'hidden',
          background: 'var(--color-kotte-night)',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'var(--color-sinha-maroon)',
          }}
        />

        {/* SVG image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* biome-ignore lint/performance/noImgElement: static SVG chart image */}
        <img
          src={src}
          alt={title}
          width={width}
          height={height}
          style={{ display: 'block', width: '100%', height: 'auto' }}
          loading="lazy"
          decoding="async"
        />

        {/* CSS hover tooltip overlays */}
        {tooltips.map((tip, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional tooltip overlays
            key={`tip-${i}`}
            className="tooltip"
            style={{
              position: 'absolute',
              left: tip.x,
              top: tip.y,
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'var(--color-temple-gold)',
              border: '2px solid var(--color-kotte-night)',
              cursor: 'crosshair',
            }}
          >
            <div
              className="tooltip-content"
              style={{
                whiteSpace: 'normal',
                maxWidth: '160px',
                textAlign: 'center',
              }}
            >
              {tip.label}
            </div>
          </div>
        ))}
      </div>

      {/* Caption */}
      {description && (
        <figcaption
          className="t-muted"
          style={{
            marginTop: 'var(--spacing-sm)',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          {description}
        </figcaption>
      )}

      {/* Heritage tag */}
      <div className="t-heritage" style={{ marginTop: 'var(--spacing-xs)' }}>
        {locale === 'en' ? 'Malindra · මලින්ද්‍ර' : 'මලින්ද්‍ර'}
      </div>
    </figure>
  );
}
