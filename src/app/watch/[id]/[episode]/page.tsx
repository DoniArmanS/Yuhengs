import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { getAnime } from "@/lib/anilist";
import { availableEpisodes, displayTitle, formatLabel, plainDescription } from "@/lib/format";
import { Player } from "@/components/player";
import { EpisodePicker } from "@/components/episode-picker";
import { EmptyState } from "@/components/empty-state";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

export async function generateMetadata(props: PageProps<"/watch/[id]/[episode]">): Promise<Metadata> {
  const { id, episode } = await props.params;
  const anime = await getAnime(Number(id));
  if (!anime) return { title: "Anime not found" };
  return { title: `${displayTitle(anime)} episode ${episode}` };
}

export default function WatchPage(props: PageProps<"/watch/[id]/[episode]">) {
  return (
    <Suspense fallback={<WatchSkeleton />}>
      <Watch params={props.params} />
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
  const available = availableEpisodes(anime);

  if (available === 0) {
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
  const episode = Math.min(Math.max(requested, 1), available);
  if (episode !== requested) redirect(`/watch/${anime.id}/${episode}`);

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
        <div className="min-w-0">
          <Player
            anilistId={anime.id}
            episode={episode}
            totalEpisodes={anime.episodes}
            title={title}
            cover={anime.coverImage.large}
            color={anime.coverImage.color}
          />

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
            {episode < available ? (
              <Link
                href={`/watch/${anime.id}/${episode + 1}`}
                className="rounded-[3px] transition-colors inline-flex h-11 items-center gap-1.5 pr-2.5 pl-4 text-sm font-semibold text-white bg-onair hover:bg-onair-hover"
              >
                Next: episode {episode + 1}
                <ChevronRightIcon className="size-4" />
              </Link>
            ) : null}
          </div>

          <div className="mt-10 border-t border-rule/60 pt-6">
            <h1 className="condensed text-4xl leading-none font-extrabold text-balance">{title}</h1>
            <p className="mt-2 flex flex-wrap gap-x-4 text-sm text-dim">
              <span>Episode {episode} of {anime.episodes ?? available}</span>
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
              <EpisodePicker animeId={anime.id} total={available} current={episode} />
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
