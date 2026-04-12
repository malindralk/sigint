'use client';

import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
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

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));

  const zoomBtn = (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" onClick={zoomOut} className="h-7 w-7">
        <ZoomOut className="h-3.5 w-3.5" />
      </Button>
      <span className="text-xs font-mono text-muted-foreground w-10 text-center">
        {Math.round(zoom * 100)}%
      </span>
      <Button variant="ghost" size="icon" onClick={zoomIn} className="h-7 w-7">
        <ZoomIn className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="bg-muted/30 border rounded-lg p-4 mb-4">
        <div className="text-xs font-mono text-destructive mb-2">Mermaid render error</div>
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">{code}</pre>
      </div>
    );
  }

  const diagramBody = (
    <div
      className="transition-transform duration-200"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
      }}
    >
      {svgContent ? (
        <div
          dangerouslySetInnerHTML={{ __html: svgContent }}
          className="mermaid-svg [&>svg]:max-w-none [&>svg]:mx-auto"
        />
      ) : (
        <div className="text-muted-foreground text-sm font-mono animate-pulse py-8 text-center">
          Rendering diagram...
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="my-6">
        {/* Preview bar */}
        <div className="flex items-center justify-between mb-2">
          {zoomBtn}
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Maximize2 className="h-3.5 w-3.5" />
              Expand
            </Button>
          </DialogTrigger>
        </div>

        {/* Inline preview */}
        <div className="overflow-x-auto rounded-lg border bg-card">
          <div className="p-4 max-h-[400px] overflow-auto">
            {diagramBody}
          </div>
        </div>
      </div>

      {/* Expanded dialog */}
      <DialogContent className="max-w-[95vw] w-[1200px] bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Diagram</span>
            {zoomBtn}
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[75vh] rounded-lg border bg-muted/20 p-6 flex items-center justify-center">
          {diagramBody}
        </div>
      </DialogContent>
    </Dialog>
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
