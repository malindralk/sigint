'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/markdown';

interface Props {
  items: TocItem[];
}

export default function TableOfContents({ items }: Props) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
    );

    headings.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="Table of contents"
      style={{
        position: 'sticky',
        top: 'calc(var(--spacing-xl, 32px) + 56px)',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        fontSize: '13px',
        lineHeight: 1.5,
      }}
    >
      <div className="t-label" style={{ marginBottom: 'var(--spacing-sm)' }}>
        Contents
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
          >
            <a
              href={`#${item.id}`}
              className="t-muted"
              style={{
                display: 'block',
                padding: '4px 0',
                textDecoration: 'none',
                borderLeft: activeId === item.id
                  ? '2px solid var(--color-temple-gold, #D49628)'
                  : '2px solid transparent',
                paddingLeft: '8px',
                color: activeId === item.id
                  ? 'var(--color-parchment, #F2E8D0)'
                  : undefined,
                transition: 'color 150ms ease, border-color 150ms ease',
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
