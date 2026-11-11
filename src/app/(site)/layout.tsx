import { Suspense, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BottomNav, BottomNavStatic } from "@/components/bottom-nav";

/** The site chrome for everything except the landing page: header, footer, and the phone tab bar. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col max-md:pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <SiteHeader />
      <main id="main" className="flex-1 overflow-x-clip">
        {children}
      </main>
      <SiteFooter />
      <Suspense fallback={<BottomNavStatic />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}
