'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { Maximize2, X, ZoomIn, ZoomOut } from 'lucide-react';
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

function ZoomControls({ zoom, onZoomIn, onZoomOut }: { zoom: number; onZoomIn: () => void; onZoomOut: () => void }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        onClick={onZoomOut}
        className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
        aria-label="Zoom out"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </button>
      <span className="text-xs font-mono text-muted-foreground w-10 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <button
        onClick={onZoomIn}
        className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
        aria-label="Zoom in"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function MermaidDiagram({ code }: { code: string }) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dialogZoom, setDialogZoom] = useState(1);
  const [open, setOpen] = useState(false);

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

  // Lock body scroll when dialog is open
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
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const dialogZoomIn = () => setDialogZoom((z) => Math.min(z + 0.25, 3));
  const dialogZoomOut = () => setDialogZoom((z) => Math.max(z - 0.25, 0.5));

  if (error) {
    return (
      <div className="my-6 bg-muted/30 border border-border rounded-lg p-4">
        <div className="text-xs font-mono text-destructive mb-2">Mermaid render error</div>
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{code}</pre>
      </div>
    );
  }

  const renderDiagram = (currentZoom: number) => (
    <div
      className="transition-transform duration-200 ease-out"
      style={{
        transform: `scale(${currentZoom})`,
        transformOrigin: 'top center',
      }}
    >
      {svgContent ? (
        <div
          dangerouslySetInnerHTML={{ __html: svgContent }}
          className="mermaid-svg"
        />
      ) : (
        <div className="text-muted-foreground text-sm font-mono animate-pulse py-8 text-center">
          Rendering diagram...
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Inline preview */}
      <div className="my-6">
        <div className="flex items-center justify-between mb-2">
          <ZoomControls zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} />
          <button
            onClick={() => { setOpen(true); setDialogZoom(zoom); }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Expand
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <div className="p-4 max-h-[400px] overflow-auto">
            {renderDiagram(zoom)}
          </div>
        </div>
      </div>

      {/* Full-screen expanded view */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-background"
          onClick={() => setOpen(false)}
        >
          {/* Header bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background sticky top-0">
            <span className="text-sm font-medium text-foreground">Diagram</span>
            <div className="flex items-center gap-3">
              <ZoomControls zoom={dialogZoom} onZoomIn={dialogZoomIn} onZoomOut={dialogZoomOut} />
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Full-screen scrollable body */}
          <div
            className="flex items-start justify-center p-8 overflow-auto"
            style={{ height: 'calc(100vh - 52px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {renderDiagram(dialogZoom)}
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
