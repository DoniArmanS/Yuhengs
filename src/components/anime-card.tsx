import Image from "next/image";
import Link from "next/link";
import type { AnimeCard as AnimeCardData } from "@/lib/types";
import { displayTitle, formatLabel } from "@/lib/format";
import { StarIcon } from "./icons";

export function AnimeCard({
  anime,
  priority = false,
  sizes = "(min-width: 1280px) 190px, (min-width: 640px) 22vw, 40vw",
}: {
  anime: AnimeCardData;
  priority?: boolean;
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
    <Link href={`/anime/${anime.id}`} className="group block rounded-[3px] outline-offset-4">
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-[3px] border border-rule transition-colors group-hover:border-paper/60"
        style={{ backgroundColor: anime.coverImage.color ?? "var(--color-panel)" }}
      >
        {cover ? <Image src={cover} alt="" fill sizes={sizes} priority={priority} className="object-cover" /> : null}
        {anime.status === "RELEASING" && aired ? (
          <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-[2px] bg-ink/90 px-1.5 py-0.5 text-xs font-bold">
            <span className="size-1.5 rounded-full bg-onair" aria-hidden />
            Airing
          </span>
        ) : null}
      </div>
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
    </Link>
  );
}
