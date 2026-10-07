import { Suspense } from "react";
import { getHomeCollections } from "@/lib/anilist";
import { getOnAirData } from "@/lib/on-air";
import { firstAppearances, seasonLabel } from "@/lib/format";
import { NewsTicker } from "@/components/news-ticker";
import { OnAir } from "@/components/on-air";
import { TonightGuide } from "@/components/tonight-guide";
import { TopTen } from "@/components/top-ten";
import { GenreChannels } from "@/components/genre-channels";
import { AnimeRow } from "@/components/anime-row";
import { ContinueWatching } from "@/components/continue-watching";

/**
 * The page itself awaits nothing: each data-backed section streams in behind
 * its own skeleton, so navigating here is instant even when caches are cold.
 */
export default function HomePage() {
  return (
    <>
      <Suspense fallback={<OnAirSkeleton />}>
        <LiveSections />
      </Suspense>
      <ContinueWatching />
      <Suspense fallback={<GuideSkeleton />}>
        <Guide />
      </Suspense>
      <Suspense fallback={<RowsSkeleton />}>
        <CatalogSections />
      </Suspense>
    </>
  );
}

async function LiveSections() {
  const { slides, justAired, justIn } = await getOnAirData();
  return (
    <>
      <NewsTicker slots={justIn} />
      <OnAir slides={slides} justAired={justAired} />
    </>
  );
}

async function Guide() {
  const { slots, readyKeys } = await getOnAirData();
  return <TonightGuide slots={slots} readyKeys={readyKeys} />;
}

async function CatalogSections() {
  const { seasonal, trending, popular, topRated, channels, season, year } = await getHomeCollections();
  const [seasonalMorph, popularMorph, topRatedMorph] = firstAppearances([seasonal, popular, topRated]);
  return (
    <>
      <TopTen items={trending} />
      <AnimeRow
        title="New this season"
        description={`${seasonLabel(season, year)}, most watched first`}
        href={`/search?season=${season}&year=${year}`}
        items={seasonal}
        morphIds={seasonalMorph}
      />
      <GenreChannels channels={channels} />
      <AnimeRow title="Most popular" href="/search?sort=POPULARITY_DESC" items={popular} morphIds={popularMorph} />
      <AnimeRow title="Highest rated" href="/search?sort=SCORE_DESC" items={topRated} morphIds={topRatedMorph} />
    </>
  );
}

function OnAirSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading new episodes">
      <div className="h-9 border-b border-rule bg-ink-deep/80" />
      <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-10 lg:pt-8">
        <div className="mb-4 h-5 w-52 animate-pulse rounded-[2px] bg-panel" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-h-[380px] animate-pulse rounded-[4px] border border-rule bg-panel sm:min-h-[460px]" />
          <div className="h-[380px] animate-pulse rounded-[4px] border border-rule bg-panel/60 lg:h-auto" />
        </div>
      </div>
    </div>
  );
}

function GuideSkeleton() {
  return (
    <div className="mx-auto mt-16 max-w-[1400px] px-4 sm:px-6 lg:px-10" aria-busy="true" aria-label="Loading guide">
      <div className="mb-5 h-8 w-48 animate-pulse rounded-[2px] bg-panel" />
      <div className="h-[200px] animate-pulse rounded-[4px] border border-rule bg-panel" />
    </div>
  );
}

function RowsSkeleton() {
  return (
    <div className="mx-auto mt-16 max-w-[1400px] px-4 sm:px-6 lg:px-10" aria-busy="true" aria-label="Loading shows">
      <div className="mb-5 h-8 w-56 animate-pulse rounded-[2px] bg-panel" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="aspect-[2/3] w-[42vw] max-w-[190px] shrink-0 animate-pulse rounded-[3px] bg-panel sm:w-[180px]" />
        ))}
      </div>
    </div>
  );
}
