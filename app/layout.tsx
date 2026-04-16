import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

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
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('malindra-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}})()`,
          }}
        />
      </head>
      <body style={{ background: "var(--theme-bg-base)", color: "var(--theme-text-primary)", fontFamily: "var(--font-ui)", height: "100vh", margin: 0, overflow: "hidden" }}>
        <div className="scanline" />
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
          <Sidebar />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
            <main style={{ flex: 1, overflow: "auto", padding: "var(--spacing-xl) var(--spacing-2xl)" }}>
              <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
                {children}
              </div>
            </main>
            <footer style={{ borderTop: "1px solid var(--theme-border)", padding: "10px var(--spacing-xl)", textAlign: "center", flexShrink: 0, background: "var(--theme-bg-base)" }}>
              <span className="t-sinhala-logo" style={{ fontSize: "14px", color: "var(--theme-text-primary)" }}>{'\u0DB8\u0DBD\u0DD2\u0DB1\u0DCA\u0DAF\u0DCA\u200D\u0DBB'}</span>
              <p className="t-muted" style={{ fontSize: "10px", fontFamily: "var(--font-ui)", marginTop: "2px", color: "var(--theme-text-muted)" }}>
                &copy; {new Date().getFullYear()}
              </p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
