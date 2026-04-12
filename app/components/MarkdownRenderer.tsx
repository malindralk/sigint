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

function MermaidDiagram({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [ready, setReady] = useState(false);
  const mermaidSvgRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

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
          mermaidSvgRef.current = svg;
          setReady(true);
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

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const renderSVG = () => {
    if (!mermaidSvgRef.current) return null;
    // Remove fixed width/height from mermaid SVG so it scales with zoom
    let svg = mermaidSvgRef.current
      .replace(/width="[^"]*"/g, 'width="100%"')
      .replace(/height="[^"]*"/g, '');
    return svg;
  };

  if (error) {
    return (
      <div className="my-6 border border-border rounded-lg p-4" style={{ background: '#0d1117' }}>
        <div className="text-xs font-mono mb-2" style={{ color: '#f85149' }}>Mermaid render error</div>
        <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: '#8b949e' }}>{code}</pre>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="my-6 border border-border rounded-lg p-8 text-center" style={{ background: '#0d1117' }}>
        <div className="text-sm font-mono animate-pulse" style={{ color: '#6e7681' }}>Rendering diagram...</div>
      </div>
    );
  }

  return (
    <>
      {/* Inline preview */}
      <div className="my-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => { setOpen(true); setZoom(1); }}
            className="text-xs px-3 py-1.5 rounded border transition-colors cursor-pointer"
            style={{
              borderColor: '#30363d',
              color: '#8b949e',
              background: 'transparent',
            }}
          >
            <span style={{ marginRight: 6 }}>Expand</span>
            &#x2922;
          </button>
          <div className="text-xs font-mono" style={{ color: '#6e7681' }}>
            {code.split('\n').length} lines
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#30363d', background: '#0d1117' }}>
          <div className="p-4" ref={containerRef} dangerouslySetInnerHTML={{ __html: renderSVG() || '' }} />
        </div>
      </div>

      {/* Full-screen expanded view */}
      {open && (
        <div
          className="fixed inset-0"
          style={{ zIndex: 99999, background: '#080b10' }}
        >
          {/* Sticky header */}
          <div
            className="flex items-center justify-between px-6 py-3 border-b"
            style={{ borderColor: '#30363d', background: '#080b10', position: 'sticky', top: 0, zIndex: 10 }}
          >
            <span className="text-sm font-mono" style={{ color: '#e6edf3' }}>Diagram</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
                  className="px-2.5 py-1 rounded border text-xs font-mono cursor-pointer transition-colors"
                  style={{ borderColor: '#30363d', color: '#8b949e', background: 'transparent' }}
                >
                  -
                </button>
                <span className="text-xs font-mono w-10 text-center" style={{ color: '#8b949e' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 5))}
                  className="px-2.5 py-1 rounded border text-xs font-mono cursor-pointer transition-colors"
                  style={{ borderColor: '#30363d', color: '#8b949e', background: 'transparent' }}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded cursor-pointer transition-colors"
                style={{ color: '#8b949e' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#161b22')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                &#x2715;
              </button>
            </div>
          </div>

          {/* Full-screen body */}
          <div
            className="flex items-start justify-center overflow-auto"
            style={{ height: 'calc(100vh - 52px)' }}
            onClick={() => setOpen(false)}
          >
            <div
              className="p-8"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
                maxWidth: '95vw',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div dangerouslySetInnerHTML={{ __html: renderSVG() || '' }} />
            </div>
          </div>
        </div>
      )}
    </>
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
