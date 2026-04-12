import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: { default: "SIGINT Wiki", template: "%s — SIGINT Wiki" },
  description: "Electromagnetic side-channel analysis, signals intelligence, and RF security research knowledge base.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ background: "var(--color-kotte-night)", color: "var(--color-ola-leaf)", fontFamily: "var(--font-ui)", minHeight: "100vh", margin: 0 }}>
        <div className="scanline" />
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1" style={{ padding: "var(--spacing-xl) var(--spacing-2xl)", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
              {children}
            </main>
            <footer className="border-t text-center" style={{ borderColor: "var(--color-border-default)", padding: "var(--spacing-md) var(--spacing-xl)" }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="t-sinhala-logo" style={{ fontSize: "14px" }}>මලින්ද්‍ර</span>
                <span className="t-muted" style={{ fontSize: "10px", fontFamily: "var(--font-ui)" }}>SIGINT WIKI</span>
              </div>
              <p className="t-muted" style={{ fontSize: "10px", fontFamily: "var(--font-ui)" }}>
                {new Date().getFullYear()} &middot; EM-SCA &middot; RF Intelligence &middot; Hardware Security
              </p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
