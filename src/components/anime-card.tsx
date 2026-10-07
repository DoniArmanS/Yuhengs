import Image from "next/image";
import { IntentLink } from "./intent-link";
import { ViewTransition } from "react";
import type { AnimeCard as AnimeCardData } from "@/lib/types";
import { displayTitle, formatLabel } from "@/lib/format";
import { PlayIcon, StarIcon } from "./icons";

export function AnimeCard({
  anime,
  priority = false,
  morph = false,
  sizes = "(min-width: 1280px) 190px, (min-width: 640px) 22vw, 40vw",
}: {
  anime: AnimeCardData;
  priority?: boolean;
  /** Morph this poster into the detail page cover. Only one card per id on a page may set it. */
  morph?: boolean;
  sizes?: string;
}) {
  const title = displayTitle(anime);
  const cover = anime.coverImage.extraLarge ?? anime.coverImage.large;
  const aired = anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : null;
  const upcoming = anime.status === "NOT_YET_RELEASED" || aired === 0;
  const episodes = upcoming
    ? "Upcoming"
    : aired
      ? `Ep ${aired}${anime.episodes ? ` of ${anime.episodes}` : ""}`
      : anime.episodes
        ? `${anime.episodes} ep${anime.episodes === 1 ? "" : "s"}`
        : null;

  return (
    <IntentLink href={`/anime/${anime.id}`} className="group block rounded-[3px] outline-offset-4">
      <Cover morph={morph} id={anime.id}>
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-[3px] border border-rule transition-colors duration-300 group-hover:border-paper/60"
        style={{ backgroundColor: anime.coverImage.color ?? "var(--color-panel)" }}
      >
        {cover ? (
          <Image
            src={cover}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : null}
        {anime.status === "RELEASING" && aired ? (
          <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-[2px] bg-ink/90 px-1.5 py-0.5 text-xs font-bold">
            <span className="size-1.5 rounded-full bg-onair" aria-hidden />
            Airing
          </span>
        ) : null}
        {/* Hover/focus reveal: genres and a play cue over a dark wash. */}
        <span
          className="absolute inset-0 flex items-end bg-gradient-to-t from-ink via-ink/60 to-transparent p-2.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden
        >
          <span className="absolute top-1/2 left-1/2 grid size-11 -translate-1/2 scale-75 place-items-center rounded-full bg-onair text-white shadow-[0_6px_24px_-4px_rgb(255_68_56/0.8)] transition-transform duration-300 ease-out group-hover:scale-100">
            <PlayIcon className="size-4 translate-x-px" />
          </span>
          {anime.genres.length ? (
            <span className="flex flex-wrap gap-1">
              {anime.genres.slice(0, 2).map((g) => (
                <span key={g} className="rounded-[2px] bg-ink/80 px-1.5 py-0.5 text-[11px] font-semibold text-paper">
                  {g}
                </span>
              ))}
            </span>
          ) : null}
        </span>
      </div>
      </Cover>
      <h3 className="mt-2.5 line-clamp-2 text-sm leading-snug font-semibold group-hover:underline group-hover:underline-offset-4">
        {title}
      </h3>
      <p className="mt-1 flex items-center gap-2.5 text-xs text-dim">
        {formatLabel(anime.format) ? <span>{formatLabel(anime.format)}</span> : null}
        {episodes ? <span>{episodes}</span> : null}
        {anime.averageScore ? (
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-guide tabular-nums">
            <StarIcon className="size-3" />
            {anime.averageScore}
          </span>
        ) : null}
      </p>
    </IntentLink>
  );
}

function Cover({ morph, id, children }: { morph: boolean; id: number; children: React.ReactNode }) {
  if (!morph) return children;
  return (
    <ViewTransition name={`cover-${id}`} share="morph" default="none">
      {children}
    </ViewTransition>
  );
}
