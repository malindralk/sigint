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
            <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
              {children}
            </main>
            <footer className="border-t px-6 py-4 text-center" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', fontSize: '10px' }}>
              SIGINT WIKI &middot; {new Date().getFullYear()} &middot; EM-SCA &middot; RF Intelligence &middot; Hardware Security
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
