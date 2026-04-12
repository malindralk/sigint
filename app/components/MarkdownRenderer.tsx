'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import 'highlight.js/styles/github-dark.css';

interface Props {
  content: string;
  category: string;
}

function transformHref(href: string | undefined, category: string): string | undefined {
  if (!href) return href;
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#') || href.startsWith('/')) return href;
  const slug = href.replace(/\.md$/, '');
  return `/${category}/${slug}`;
}

const ZOOM_LEVELS = [1, 1.5, 2] as const;

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [zoomIdx, setZoomIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 8)}`;
        const { svg } = await mermaid.render(id, code);

        if (!cancelled) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Mermaid render error:', err);
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code]);

  const cycleZoom = () => setZoomIdx((i) => (i + 1) % ZOOM_LEVELS.length);
  const zoom = ZOOM_LEVELS[zoomIdx];

  if (error) {
    return (
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-4 mb-4">
        <div className="text-xs font-mono text-accent-red mb-2">Mermaid render error</div>
        <pre className="text-xs text-text-secondary font-mono whitespace-pre-wrap">{code}</pre>
      </div>
    );
  }

  return (
    <div className="my-6">
      {/* Zoom controls */}
      <div className="flex items-center justify-end mb-2 gap-2">
        <span className="text-xs text-text-muted font-mono">Zoom:</span>
        {ZOOM_LEVELS.map((z) => (
          <button
            key={z}
            onClick={cycleZoom}
            className={`text-xs px-2.5 py-1 rounded border font-mono transition-colors ${
              ZOOM_LEVELS[zoomIdx] === z
                ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/10'
                : 'border-border-muted text-text-muted hover:text-text-secondary'
            }`}
          >
            {z}x
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-border-default bg-bg-secondary">
        <div
          className="mermaid-diagram p-4"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            minWidth: `${100 * zoom}%`,
          }}
        >
          {svgContent ? (
            <div
              ref={containerRef}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="text-text-muted text-sm font-mono animate-pulse py-8 text-center">
              Rendering diagram...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MarkdownRenderer({ content, category }: Props) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          a({ href, children, ...props }) {
            return <a href={transformHref(href, category)} {...props}>{children}</a>;
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            if (match && match[1] === 'mermaid' && typeof children === 'string') {
              return <MermaidDiagram code={children} />;
            }
            return <code className={className} {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
