import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { MangaFooter, MangaHeader } from "@/components/manga/manga-chrome";
import { MangaBottomNav, MangaBottomNavStatic } from "@/components/manga/manga-bottom-nav";

export const metadata: Metadata = {
  title: { default: "Manga", template: "%s · Yuhengs manga" },
  description: "Read manga, manhwa and manhua: every chapter from every group, merged into one list.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#222436",
};

/** The manga section: Tokyo Night Moon (see .theme-moon in globals.css) and its own header. */
export default function MangaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-moon flex min-h-dvh flex-1 flex-col bg-ink text-paper max-md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <MangaHeader />
      <main id="main" className="flex-1 overflow-x-clip">
        {children}
      </main>
      <MangaFooter />
      <Suspense fallback={<MangaBottomNavStatic />}>
        <MangaBottomNav />
      </Suspense>
    </div>
  );
}
