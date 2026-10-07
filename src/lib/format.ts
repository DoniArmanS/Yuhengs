import type { AnimeCard, MediaFormat, MediaSeason, MediaStatus } from "./types";

export function displayTitle(anime: Pick<AnimeCard, "title">): string {
  return anime.title.english || anime.title.romaji || "Untitled";
}

const FORMAT_LABELS: Record<MediaFormat, string> = {
  TV: "TV",
  TV_SHORT: "TV short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
};

export function formatLabel(format: MediaFormat | null): string | null {
  return format ? FORMAT_LABELS[format] : null;
}

const STATUS_LABELS: Record<MediaStatus, string> = {
  FINISHED: "Finished",
  RELEASING: "Airing",
  NOT_YET_RELEASED: "Upcoming",
  CANCELLED: "Cancelled",
  HIATUS: "On hiatus",
};

export function statusLabel(status: MediaStatus | null): string | null {
  return status ? STATUS_LABELS[status] : null;
}

export function seasonLabel(season: MediaSeason | null, year: number | null): string | null {
  if (!season && !year) return null;
  const name = season ? season.charAt(0) + season.slice(1).toLowerCase() : "";
  return [name, year].filter(Boolean).join(" ");
}

/** AniList descriptions contain light HTML (<br>, <i>) and source notes. */
export function plainDescription(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/\(Source:[^)]*\)/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Episodes a viewer can actually watch right now. For airing shows that's the
 * last aired episode; unknown totals get a generous fallback.
 */
export function availableEpisodes(anime: Pick<AnimeCard, "episodes" | "status" | "nextAiringEpisode">): number {
  if (anime.status === "NOT_YET_RELEASED") return 0;
  if (anime.status === "RELEASING" && anime.nextAiringEpisode) {
    return Math.max(anime.nextAiringEpisode.episode - 1, 0);
  }
  return anime.episodes ?? 0;
}
