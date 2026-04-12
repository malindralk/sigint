'use client';

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
  // Convert relative wiki links (e.g. "organizations.md") to absolute category paths
  const slug = href.replace(/\.md$/, '');
  return `/${category}/${slug}`;
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
