import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BottomNav, BottomNavStatic } from "@/components/bottom-nav";
import { Suspense } from "react";
import "./globals.css";

// Self-hosted Latin subset of Archivo's variable font (weight 100–900,
// width 62–125%), so one file covers condensed titles and body text.
const archivo = localFont({
  variable: "--font-archivo",
  src: "./fonts/archivo-variable-latin.woff2",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Yuhengs — new anime episodes as they air",
    template: "%s · Yuhengs",
  },
  description:
    "Watch anime free in sub and dub. See what just aired, what's on tonight, and pick up where you left off.",
};

export const viewport: Viewport = {
  themeColor: "#0f1626",
  // Lets the layout extend under the notch/home indicator; safe-area insets pad it back.
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col max-md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <a
          href="#main"
          className="sr-only z-50 rounded-[2px] bg-paper px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1 overflow-x-clip">
          {children}
        </main>
        <SiteFooter />
        <Suspense fallback={<BottomNavStatic />}>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
