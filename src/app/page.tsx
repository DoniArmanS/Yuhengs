import { getBroadcast, getHomeCollections } from "@/lib/anilist";
import { seasonLabel } from "@/lib/format";
import { OnAir } from "@/components/on-air";
import { TonightGuide } from "@/components/tonight-guide";
import { AnimeRow } from "@/components/anime-row";
import { ContinueWatching } from "@/components/continue-watching";

export default async function HomePage() {
  const [{ seasonal, trending, popular, topRated, season, year }, { slots, fetchedAt }] = await Promise.all([
    getHomeCollections(),
    getBroadcast(),
  ]);

  return (
    <>
      <OnAir slots={slots} fetchedAt={fetchedAt} />
      <ContinueWatching />
      <TonightGuide slots={slots} />
      <AnimeRow
        title="New this season"
        description={`${seasonLabel(season, year)}, most watched first`}
        href={`/search?season=${season}&year=${year}`}
        items={seasonal}
      />
      <AnimeRow title="Trending now" href="/search?sort=TRENDING_DESC" items={trending} />
      <AnimeRow title="Most popular" href="/search?sort=POPULARITY_DESC" items={popular} />
      <AnimeRow title="Highest rated" href="/search?sort=SCORE_DESC" items={topRated} />
    </>
  );
}
