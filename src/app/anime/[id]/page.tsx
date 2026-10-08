import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { getAnime } from "@/lib/anilist";
import {
  availableEpisodes,
  displayTitle,
  formatLabel,
  plainDescription,
  firstAppearances,
  seasonLabel,
  statusLabel,
} from "@/lib/format";
import type { AnimeCard } from "@/lib/types";
import { AnimeRow } from "@/components/anime-row";
import { EpisodePicker } from "@/components/episode-picker";
import { WatchCta } from "@/components/watch-cta";
import { LocalTime } from "@/components/local-time";
import { LiveCheck } from "@/components/live-check";
import { ExpandableText } from "@/components/expandable-text";
import { latestReadyEpisode } from "@/lib/availability";
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
    <Suspense
      fallback={
        <ViewTransition exit="slide-down" default="none">
          <DetailSkeleton />
        </ViewTransition>
      }
    >
      <ViewTransition enter="slide-up" default="none">
        <AnimeDetail params={props.params} />
      </ViewTransition>
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
  const aired = availableEpisodes(anime);
  const description = plainDescription(anime.description);
  const studio = anime.studios.nodes[0]?.name;
  const related = anime.relations.edges
    .filter((e) => e.node.type === "ANIME" && e.node.format !== "MUSIC")
    .map((e) => e.node as AnimeCard);
  const recommended = anime.recommendations.nodes
    .map((n) => n.mediaRecommendation)
    .filter((m): m is AnimeCard => m !== null);
  // The cover already carries this anime's morph name, so exclude it from the rows.
  const [relatedMorph, recommendedMorph] = firstAppearances([related, recommended], [anime.id]);

  const facts = [
    { label: "Format", value: formatLabel(anime.format) },
    { label: "Episodes", value: anime.episodes ? String(anime.episodes) : null },
    { label: "Length", value: anime.duration ? `${anime.duration} min` : null },
    { label: "Status", value: statusLabel(anime.status) },
    { label: "Season", value: seasonLabel(anime.season, anime.seasonYear) },
    { label: "Studio", value: studio ?? null },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value));

  return (
    <article className="relative isolate" style={{ ["--ambient" as string]: anime.coverImage.color ?? "#ff4438" }}>
      {/* The show's own colour washes the top of the page. */}
      <div className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] opacity-90" aria-hidden />
      <div className="relative h-[220px] overflow-hidden sm:h-[300px] lg:h-[340px]">
        {anime.bannerImage ? (
          <Image src={anime.bannerImage} alt="" fill priority sizes="100vw" className="object-cover" />
        ) : (
          <div
            className="absolute inset-0 opacity-50"
            style={{ backgroundColor: anime.coverImage.color ?? "var(--color-panel)" }}
          />
        )}
        <div className="scanlines absolute inset-0 opacity-50" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
      </div>

      <div className="relative mx-auto -mt-28 grid max-w-[1400px] gap-8 px-4 sm:-mt-36 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 lg:px-10">
        <ViewTransition name={`cover-${anime.id}`} share="morph" default="none">
        <div
          className="relative aspect-[2/3] w-40 overflow-hidden rounded-[4px] border border-paper/20 shadow-[0_30px_70px_-18px_var(--ambient)] sm:w-48 md:w-full"
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
        </ViewTransition>

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
                className="inline-flex min-h-10 items-center text-dim underline-offset-4 hover:text-paper hover:underline"
              >
                {genre}
              </Link>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            {aired > 0 ? (
              <Suspense fallback={<CtaChecking />}>
                <ReadyCta animeId={anime.id} aired={aired} />
              </Suspense>
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
            <ExpandableText
              paragraphs={description.split(/\n+/)}
              className="mt-6 max-w-[68ch] leading-relaxed text-paper/85 md:mt-8"
            />
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

      {aired > 0 ? (
        <section className="mx-auto mt-14 max-w-[1400px] px-4 sm:px-6 lg:px-10" aria-labelledby="episodes">
          <Suspense fallback={<EpisodesChecking aired={aired} />}>
            <ReadyEpisodes animeId={anime.id} aired={aired} />
          </Suspense>
        </section>
      ) : null}

      <AnimeRow title="Related" items={related} morphIds={relatedMorph} />
      <AnimeRow title="If you liked this" items={recommended} morphIds={recommendedMorph} />
    </article>
  );
}

/** Watch button for the newest episode the servers actually have. */
async function ReadyCta({ animeId, aired }: { animeId: number; aired: number }) {
  const ready = await latestReadyEpisode(animeId, aired);
  if (ready === 0) {
    return <p className="rounded-[3px] border border-rule bg-panel px-4 py-3 text-sm text-dim">Not on our servers yet</p>;
  }
  return <WatchCta animeId={animeId} available={ready} />;
}

function CtaChecking() {
  return (
    <span className="inline-flex h-12 items-center gap-2.5 rounded-[3px] border border-rule bg-panel px-5 text-sm text-dim" role="status">
      <span className="tuning size-2 rounded-full bg-onair" aria-hidden />
      Checking servers…
    </span>
  );
}

async function ReadyEpisodes({ animeId, aired }: { animeId: number; aired: number }) {
  const ready = await latestReadyEpisode(animeId, aired);
  return (
    <>
      <h2 id="episodes" className="condensed mb-5 text-3xl font-extrabold">
        Episodes
        <span className="ml-3 align-middle text-sm font-normal [font-stretch:100%] [word-spacing:normal] text-faint">
          {ready} ready to watch
        </span>
      </h2>
      {ready < aired ? (
        <div className="mb-5">
          <LiveCheck animeId={animeId} aired={aired} ready={ready} />
        </div>
      ) : null}
      {ready > 0 ? <EpisodePicker animeId={animeId} total={ready} /> : null}
    </>
  );
}

function EpisodesChecking({ aired }: { aired: number }) {
  return (
    <div aria-busy="true">
      <h2 id="episodes" className="condensed mb-5 text-3xl font-extrabold">
        Episodes
      </h2>
      <p className="mb-4 flex items-center gap-2.5 text-sm text-dim" role="status">
        <span className="tuning size-2 rounded-full bg-onair" aria-hidden />
        Checking which episodes are on our servers…
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] gap-2">
        {Array.from({ length: Math.min(aired, 24) }, (_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-[2px] bg-panel" />
        ))}
      </div>
    </div>
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
