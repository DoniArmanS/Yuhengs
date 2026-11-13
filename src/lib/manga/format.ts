import type { MediaStatus } from "@/lib/types";

/* Manga types and display helpers, safe to import from client components. */

export type CountryOfOrigin = "JP" | "KR" | "CN" | "TW";

export interface MangaCard {
  id: number;
  title: { romaji: string | null; english: string | null };
  coverImage: { extraLarge: string | null; large: string | null; color: string | null };
  format: "MANGA" | "NOVEL" | "ONE_SHOT" | null;
  status: MediaStatus | null;
  chapters: number | null;
  averageScore: number | null;
  countryOfOrigin: CountryOfOrigin | null;
  genres: string[];
}

export interface RelatedMedia {
  id: number;
  type: "ANIME" | "MANGA";
  format: string | null;
  title: { romaji: string | null; english: string | null };
  coverImage: { extraLarge: string | null; large: string | null; color: string | null };
  episodes: number | null;
  chapters: number | null;
  status: MediaStatus | null;
  averageScore: number | null;
  countryOfOrigin: CountryOfOrigin | null;
  genres: string[];
}

export interface MangaDetail extends MangaCard {
  title: { romaji: string | null; english: string | null; native: string | null };
  synonyms: string[];
  bannerImage: string | null;
  description: string | null;
  volumes: number | null;
  isAdult: boolean;
  startDate: { year: number | null };
  staff: { edges: { role: string; node: { name: { full: string } } }[] };
  relations: { edges: { relationType: string; node: RelatedMedia }[] };
  recommendations: { nodes: { mediaRecommendation: MangaCard | null }[] };
  externalLinks: { url: string; site: string; type: string | null; language: string | null }[];
}

export function mangaTitle(m: Pick<MangaCard, "title">): string {
  return m.title.english || m.title.romaji || "Untitled";
}

/** Manga, manhwa or manhua, from where it was first published. */
export function mangaKind(country: CountryOfOrigin | null): "Manga" | "Manhwa" | "Manhua" {
  return country === "KR" ? "Manhwa" : country === "CN" || country === "TW" ? "Manhua" : "Manga";
}

/** Japanese manga read right to left one page at a time; webtoons scroll. */
export function defaultReadingMode(country: CountryOfOrigin | null): "page" | "strip" {
  return country === "KR" || country === "CN" || country === "TW" ? "strip" : "page";
}

const STATUS: Record<MediaStatus, string> = {
  FINISHED: "Finished",
  RELEASING: "Ongoing",
  NOT_YET_RELEASED: "Upcoming",
  CANCELLED: "Cancelled",
  HIATUS: "On hiatus",
};

export function mangaStatus(status: MediaStatus | null): string | null {
  return status ? STATUS[status] : null;
}
