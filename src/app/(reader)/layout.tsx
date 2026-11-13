import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Reader", template: "%s · Yuhengs manga" },
  description: "Read manga, manhwa and manhua: every chapter from every group, merged into one list.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1e2030",
};

/** The reader takes the whole screen: no site header, footer or tab bar. */
export default function ReaderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-moon flex min-h-dvh flex-1 flex-col bg-ink-deep text-paper">
      <main id="main" className="flex-1">
        {children}
      </main>
    </div>
  );
}
