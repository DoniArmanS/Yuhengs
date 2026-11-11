import { PosterWallHero } from "@/components/poster-wall-hero";
import { AboutYuhengs } from "@/components/about-yuhengs";
import { FinalCall, HowItWorks, LandingHeader } from "@/components/landing-sections";
import { SiteFooter } from "@/components/site-footer";

/**
 * The front door at /. It is deliberately not the dashboard: one full-screen
 * poster wall with search and a single way in (/home), then how Yuhengs
 * works, why it's worth using, and the questions new visitors ask.
 */
export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main id="main" className="flex-1 overflow-x-clip">
        <PosterWallHero />
        <HowItWorks />
        <AboutYuhengs />
        <FinalCall />
      </main>
      <SiteFooter />
    </>
  );
}
