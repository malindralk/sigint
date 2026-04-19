import type { Metadata } from "next";
import Script from "next/script";
import { Cormorant_Garamond, DM_Sans, Noto_Serif_Sinhala } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/MobileHeader";
import Footer from "./components/Footer";
import { ConsentDialog } from "./components/consent";
import { AuthProvider } from "./lib/auth/context";
import { LocaleProvider } from "./hooks/useLocale";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
  display: "swap",
});

const notoSinhala = Noto_Serif_Sinhala({
  subsets: ["sinhala"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sinhala",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "SIGINT Wiki", template: "%s — SIGINT Wiki" },
  description: "Electromagnetic side-channel analysis, signals intelligence, and RF security research knowledge base.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://malindra.lk'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${cormorant.variable} ${dmSans.variable} ${notoSinhala.variable}`}>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('malindra-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light')}catch(e){}})()`}
        </Script>
      </head>
      <body style={{ background: "var(--theme-bg-base)", color: "var(--theme-text-primary)", fontFamily: "var(--font-ui)", height: "100vh", margin: 0, overflow: "hidden" }}>
        <AuthProvider>
          <LocaleProvider>
            <div className="scanline" />
            {/* Mobile top bar — visible below lg breakpoint */}
            <MobileHeader />
            <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
              <Sidebar />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
                <main style={{ flex: 1, overflow: "auto", padding: "var(--spacing-xl) var(--spacing-2xl)" }} className="mobile-main">
                  <div style={{ maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
                    {children}
                  </div>
                </main>
                <Footer />
              </div>
            </div>
            {/* Privacy consent dialog - shows on first visit */}
            <ConsentDialog />
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
