import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAnime } from "@/lib/anilist";
import {
  availableEpisodes,
  displayTitle,
  formatLabel,
  plainDescription,
  seasonLabel,
  statusLabel,
} from "@/lib/format";
import type { AnimeCard } from "@/lib/types";
import { AnimeRow } from "@/components/anime-row";
import { EpisodePicker } from "@/components/episode-picker";
import { WatchCta } from "@/components/watch-cta";
import { LocalTime } from "@/components/local-time";
import { StarIcon } from "@/components/icons";

export async function generateMetadata(props: PageProps<"/anime/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const anime = await getAnime(Number(id));
  if (!anime) return { title: "Anime not found" };
  const title = displayTitle(anime);
  return {
    title: `Watch ${title}`,
    description: plainDescription(anime.description).slice(0, 160),
    openGraph: { images: anime.bannerImage ?? anime.coverImage.extraLarge ?? undefined },
  };
}

export default function AnimePage(props: PageProps<"/anime/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AnimeDetail params={props.params} />
    </Suspense>
  );
}

async function AnimeDetail({ params }: Pick<PageProps<"/anime/[id]">, "params">) {
  const { id } = await params;
  const animeId = Number(id);
  if (!Number.isInteger(animeId) || animeId <= 0) notFound();

  const anime = await getAnime(animeId);
  if (!anime) notFound();

  const title = displayTitle(anime);
  const available = availableEpisodes(anime);
  const description = plainDescription(anime.description);
  const studio = anime.studios.nodes[0]?.name;
  const related = anime.relations.edges
    .filter((e) => e.node.type === "ANIME" && e.node.format !== "MUSIC")
    .map((e) => e.node as AnimeCard);
  const recommended = anime.recommendations.nodes
    .map((n) => n.mediaRecommendation)
    .filter((m): m is AnimeCard => m !== null);

  const facts = [
    { label: "Format", value: formatLabel(anime.format) },
    { label: "Episodes", value: anime.episodes ? String(anime.episodes) : null },
    { label: "Length", value: anime.duration ? `${anime.duration} min` : null },
    { label: "Status", value: statusLabel(anime.status) },
    { label: "Season", value: seasonLabel(anime.season, anime.seasonYear) },
    { label: "Studio", value: studio ?? null },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  return (
    <article>
      <div className="relative h-[220px] overflow-hidden sm:h-[300px] lg:h-[340px]">
        {anime.bannerImage ? (
          <Image src={anime.bannerImage} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div
            className="absolute inset-0 opacity-50"
            style={{ backgroundColor: anime.coverImage.color ?? "var(--color-panel)" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
      </div>

      <div className="relative mx-auto -mt-28 grid max-w-[1400px] gap-8 px-4 sm:-mt-36 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:px-10">
        <div
          className="relative aspect-[2/3] w-40 overflow-hidden rounded-[3px] border border-rule-strong shadow-2xl shadow-black/50 sm:w-48 md:w-full"
          style={{ backgroundColor: anime.coverImage.color ?? "var(--color-panel)" }}
        >
          {anime.coverImage.extraLarge ? (
            <Image
              src={anime.coverImage.extraLarge}
              alt={`${title} cover art`}
              fill
              priority
              sizes="(min-width: 1024px) 260px, (min-width: 768px) 220px, 192px"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="min-w-0 md:pt-24 lg:pt-32">
          <h1 className="condensed text-[clamp(2.5rem,5.5vw,4rem)] leading-[0.95] font-extrabold text-balance">
            {title}
          </h1>
          {anime.title.native || (anime.title.english && anime.title.romaji) ? (
            <p className="mt-2 text-sm text-dim">
              {[anime.title.english ? anime.title.romaji : null, anime.title.native].filter(Boolean).join("  /  ")}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            {anime.averageScore ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-guide">
                <StarIcon className="size-4" />
                {anime.averageScore}% liked
              </span>
            ) : null}
            {anime.genres.map((genre) => (
              <Link
                key={genre}
                href={`/search?genre=${encodeURIComponent(genre)}`}
                className="text-dim underline-offset-4 hover:text-paper hover:underline"
              >
                {genre}
              </Link>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            {available > 0 ? (
              <WatchCta animeId={anime.id} available={available} />
            ) : (
              <p className="rounded-[3px] border border-rule bg-panel px-4 py-3 text-sm text-dim">
                {anime.nextAiringEpisode ? (
                  <>
                    Episode 1 airs{" "}
                    <LocalTime
                      timestamp={anime.nextAiringEpisode.airingAt}
                      options={{ weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
                    />
                    .
                  </>
                ) : (
                  "Not released yet. Check back when it starts airing."
                )}
              </p>
            )}
            {anime.status === "RELEASING" && anime.nextAiringEpisode ? (
              <p className="text-sm text-dim">
                Episode {anime.nextAiringEpisode.episode} airs{" "}
                <LocalTime
                  timestamp={anime.nextAiringEpisode.airingAt}
                  options={{ weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
                />
              </p>
            ) : null}
          </div>

          {description ? (
            <div className="mt-8 max-w-[68ch] space-y-3 leading-relaxed text-paper/85">
              {description.split(/\n+/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : null}

          <dl className="mt-8 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-4 border-t border-rule/60 pt-6 sm:grid-cols-3">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-faint">{f.label}</dt>
                <dd className="mt-0.5 text-sm font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {available > 0 ? (
        <section className="mx-auto mt-14 max-w-[1400px] px-4 sm:px-6 lg:px-10" aria-labelledby="episodes">
          <h2 id="episodes" className="condensed mb-5 text-3xl font-extrabold">
            Episodes
            <span className="ml-3 align-middle text-sm font-normal [font-stretch:100%] text-faint">
              {available} available
            </span>
          </h2>
          <EpisodePicker animeId={anime.id} total={available} />
        </section>
      ) : null}

      <AnimeRow title="Related" items={related} />
      <AnimeRow title="If you liked this" items={recommended} />
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading anime">
      <div className="h-[220px] animate-pulse bg-panel sm:h-[300px] lg:h-[340px]" />
      <div className="relative mx-auto -mt-28 grid max-w-[1400px] gap-8 px-4 sm:-mt-36 sm:px-6 md:grid-cols-[220px_1fr] lg:grid-cols-[260px_1fr] lg:gap-12 lg:px-10">
        <div className="aspect-[2/3] w-40 animate-pulse rounded-[3px] bg-panel-raised sm:w-48 md:w-full" />
        <div className="space-y-4 md:pt-32">
          <div className="h-10 w-2/3 animate-pulse rounded bg-panel-raised" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-panel" />
          <div className="h-12 w-48 animate-pulse rounded bg-panel-raised" />
          <div className="h-24 max-w-[68ch] animate-pulse rounded bg-panel" />
        </div>
      </div>
    </div>
  );
}
