import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/chrome/Header";
import Footer from "@/components/chrome/Footer";
import Cursor from "@/components/chrome/Cursor";
import ScrollProgress from "@/components/chrome/ScrollProgress";
import { LangProvider } from "@/lib/i18n";
import { site } from "@/lib/site";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.title}, Nairobi`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  keywords: [
    "AI systems engineer",
    "Nairobi",
    "Kenya",
    "multi-agent systems",
    "production AI",
    "Keja AI",
    "Tapi Learn",
    "AgentReplay",
    "agricultural AI",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  openGraph: {
    type: "website",
    locale: "en",
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.title}, Nairobi`,
    description: site.description,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Victor Ndunda — AI Systems Engineer, Nairobi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.title}, Nairobi`,
    description: site.description,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#070808",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-base font-sans text-ink antialiased">
        <LangProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-acid focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-[#070808]"
          >
            Skip to content
          </a>
          <ScrollProgress />
          <div className="grain" aria-hidden="true" />
          <Cursor />
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </LangProvider>
      </body>
    </html>
  );
}
