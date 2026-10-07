import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { getAnime } from "@/lib/anilist";
import { availableEpisodes, displayTitle, formatLabel, plainDescription } from "@/lib/format";
import { Player } from "@/components/player";
import { EpisodePicker } from "@/components/episode-picker";
import { EmptyState } from "@/components/empty-state";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { LiveCheck } from "@/components/live-check";
import { checkEpisode, latestReadyEpisode } from "@/lib/availability";

export async function generateMetadata(props: PageProps<"/watch/[id]/[episode]">): Promise<Metadata> {
  const { id, episode } = await props.params;
  const anime = await getAnime(Number(id));
  if (!anime) return { title: "Anime not found" };
  return { title: `${displayTitle(anime)} episode ${episode}` };
}

export default function WatchPage(props: PageProps<"/watch/[id]/[episode]">) {
  return (
    <Suspense
      fallback={
        <ViewTransition exit="slide-down" default="none">
          <WatchSkeleton />
        </ViewTransition>
      }
    >
      <ViewTransition enter="slide-up" default="none">
        <Watch params={props.params} />
      </ViewTransition>
    </Suspense>
  );
}

async function Watch({ params }: Pick<PageProps<"/watch/[id]/[episode]">, "params">) {
  const { id, episode: episodeParam } = await params;
  const animeId = Number(id);
  const requested = Number(episodeParam);
  if (!Number.isInteger(animeId) || animeId <= 0 || !Number.isInteger(requested)) notFound();

  const anime = await getAnime(animeId);
  if (!anime) notFound();

  const title = displayTitle(anime);
  const aired = availableEpisodes(anime);

  if (aired === 0) {
    return (
      <EmptyState title={`${title} hasn’t aired yet`}>
        <p>
          There’s nothing to stream until the first episode is out.{" "}
          <Link href={`/anime/${anime.id}`} className="text-paper underline-offset-4 hover:underline">
            See details and air date
          </Link>
        </p>
      </EmptyState>
    );
  }

  // Keep URLs honest: out-of-range episodes go to the nearest real one.
  const episode = Math.min(Math.max(requested, 1), aired);
  if (episode !== requested) redirect(`/watch/${anime.id}/${episode}`);

  // Aired isn't the same as playable: ask the servers what they actually have.
  const [ready, check] = await Promise.all([latestReadyEpisode(anime.id, aired), checkEpisode(anime.id, episode)]);
  const uploading = episode > ready;
  const missingOn = [check.aniembed === false && "aniembed", check.megaplay === false && "megaplay"].filter(
    (s): s is string => Boolean(s),
  );

  const description = plainDescription(anime.description).split(/\n+/)[0];

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-dim">
        <Link href={`/anime/${anime.id}`} className="hover:text-paper">
          {title}
        </Link>
        <span className="mx-2 text-faint" aria-hidden>
          /
        </span>
        <span className="text-paper" aria-current="page">
          Episode {episode}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative isolate min-w-0" style={{ ["--ambient" as string]: anime.coverImage.color ?? "#ff4438" }}>
          {/* Ambilight: the show's colour glows around the player. */}
          <div className="ambient-glow pointer-events-none absolute -inset-x-16 -top-16 -z-10 h-[min(75vw,620px)] opacity-100 blur-3xl saturate-150" aria-hidden />
          {uploading ? (
            <div className="flex aspect-video flex-col items-center justify-center gap-4 rounded-[3px] border border-rule-strong bg-ink-deep p-6 text-center">
              <p className="condensed text-3xl font-extrabold">
                {ready > 0 ? `Episode ${episode} is still uploading` : `Episode ${episode} isn’t on our servers yet`}
              </p>
              <p className="max-w-md text-sm text-dim">
                {ready > 0
                  ? "It has aired, but our servers don’t have it yet. New episodes usually arrive within an hour."
                  : "It has aired, but no streaming server carries this show yet. Some shows are picked up later, and some never are."}
              </p>
              {ready > 0 ? (
                <Link
                  href={`/watch/${anime.id}/${ready}`}
                  className="inline-flex h-11 items-center rounded-[3px] border border-rule-strong px-4 text-sm font-semibold transition-colors hover:border-paper/60"
                >
                  Watch episode {ready} instead
                </Link>
              ) : null}
            </div>
          ) : (
            <Player
              anilistId={anime.id}
              episode={episode}
              totalEpisodes={anime.episodes}
              title={title}
              cover={anime.coverImage.large}
              color={anime.coverImage.color}
              missingOn={missingOn}
            />
          )}
          {ready < aired ? (
            <div className="mt-4">
              <LiveCheck animeId={anime.id} aired={aired} ready={ready} />
            </div>
          ) : null}

          <div className="mt-6 flex items-center justify-between gap-3">
            {episode > 1 ? (
              <Link
                href={`/watch/${anime.id}/${episode - 1}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-[2px] border border-rule bg-panel pr-4 pl-2.5 text-sm font-semibold hover:border-paper/50"
              >
                <ChevronLeftIcon className="size-4" />
                Episode {episode - 1}
              </Link>
            ) : (
              <span />
            )}
            {episode < ready ? (
              <Link
                href={`/watch/${anime.id}/${episode + 1}`}
                className="rounded-[3px] transition-[background-color,transform] duration-150 active:scale-[0.97] inline-flex h-11 items-center gap-1.5 pr-2.5 pl-4 text-sm font-semibold text-white bg-onair hover:bg-onair-hover"
              >
                Next: episode {episode + 1}
                <ChevronRightIcon className="size-4" />
              </Link>
            ) : null}
          </div>

          <div className="mt-10 border-t border-rule/60 pt-6">
            <h1 className="condensed text-4xl leading-none font-extrabold text-balance">{title}</h1>
            <p className="mt-2 flex flex-wrap gap-x-4 text-sm text-dim">
              <span>Episode {episode} of {anime.episodes ?? aired}</span>
              {formatLabel(anime.format) ? <span>{formatLabel(anime.format)}</span> : null}
              {anime.genres.length ? <span>{anime.genres.slice(0, 3).join(", ")}</span> : null}
            </p>
            {description ? (
              <p className="mt-4 line-clamp-3 max-w-[68ch] leading-relaxed text-paper/80">{description}</p>
            ) : null}
            <Link href={`/anime/${anime.id}`} className="mt-3 inline-block text-sm font-medium text-paper underline underline-offset-4 hover:text-dim">
              Full details
            </Link>
          </div>
        </div>

        <aside aria-labelledby="episode-list" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[3px] border border-rule/70 bg-panel/60 p-4">
            <h2 id="episode-list" className="condensed mb-4 text-xl font-extrabold">
              Episodes
            </h2>
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              {ready > 0 ? (
                <EpisodePicker animeId={anime.id} total={ready} current={episode} />
              ) : (
                <p className="text-sm text-dim">No episodes are on our servers yet.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function WatchSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading player" className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 lg:px-10">
      <div className="mb-4 h-4 w-48 animate-pulse rounded bg-panel" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="aspect-video animate-pulse rounded-[3px] bg-panel" />
        <div className="h-80 animate-pulse rounded-[3px] bg-panel/60" />
      </div>
    </div>
  );
}
