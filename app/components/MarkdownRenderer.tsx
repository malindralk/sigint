'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import 'highlight.js/styles/github-dark.css';

interface Props {
  content: string;
}

function transformHref(href: string | undefined): string | undefined {
  if (!href) return href;
  // Leave external links alone
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) return href;
  // Strip .md extension from relative wiki-style links
  return href.replace(/\.md$/, '');
}

export default function MarkdownRenderer({ content }: Props) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          a({ href, children, ...props }) {
            return <a href={transformHref(href)} {...props}>{children}</a>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
