// MALINDRA PHASE 2
// app/blog/layout.tsx
// Standalone layout for the Malindra blog — uses root layout's MobileHeader/Sidebar.
// This layout only provides blog-specific styling and footer.

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: { default: 'Malindra', template: '%s — Malindra' },
  description:
    'Sovereign strategy intelligence on Sri Lankan and Laccadive Sea socio-economic and geopolitical dynamics.',
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
