import type { Metadata } from 'next';
import './globals.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

export const metadata: Metadata = {
  title: { default: 'SIGINT Wiki', template: '%s — SIGINT Wiki' },
  description: 'Electromagnetic side-channel analysis, signals intelligence, and RF security research knowledge base.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', minHeight: '100vh', margin: 0 }}>
        <div className="scanline" />
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1" style={{ padding: 'var(--space-xl) var(--space-2xl)', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
              {children}
            </main>
            <footer className="border-t text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: '10px', padding: 'var(--space-md) var(--space-xl)' }}>
              SIGINT WIKI &middot; {new Date().getFullYear()} &middot; EM-SCA &middot; RF Intelligence &middot; Hardware Security
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
