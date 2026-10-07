import type { SearchFilters } from "./anilist";
import type { MediaFormat, MediaSeason, MediaStatus } from "./types";

export const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Mahou Shoujo",
  "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life",
  "Sports", "Supernatural", "Thriller",
];

export const SEASONS: { value: MediaSeason; label: string }[] = [
  { value: "WINTER", label: "Winter" },
  { value: "SPRING", label: "Spring" },
  { value: "SUMMER", label: "Summer" },
  { value: "FALL", label: "Fall" },
];

export const FORMATS: { value: MediaFormat; label: string }[] = [
  { value: "TV", label: "TV" },
  { value: "MOVIE", label: "Movie" },
  { value: "ONA", label: "ONA" },
  { value: "OVA", label: "OVA" },
  { value: "SPECIAL", label: "Special" },
  { value: "TV_SHORT", label: "TV short" },
];

export const STATUSES: { value: MediaStatus; label: string }[] = [
  { value: "RELEASING", label: "Airing" },
  { value: "FINISHED", label: "Finished" },
  { value: "NOT_YET_RELEASED", label: "Upcoming" },
];

export const SORTS = [
  { value: "POPULARITY_DESC", label: "Most popular" },
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "SCORE_DESC", label: "Highest rated" },
  { value: "START_DATE_DESC", label: "Newest" },
  { value: "TITLE_ROMAJI", label: "Title A–Z" },
];

type Params = Record<string, string | string[] | undefined>;

function one(params: Params, key: string): string | undefined {
  const v = params[key];
  return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
}

function pick<T extends string>(value: string | undefined, allowed: readonly { value: T }[]): T | undefined {
  return allowed.find((a) => a.value === value)?.value;
}

/** Turn untrusted query params into a filter object AniList will accept. */
export function parseFilters(params: Params): SearchFilters {
  const year = Number(one(params, "year"));
  const page = Number(one(params, "page"));
  const genre = one(params, "genre");
  return {
    search: one(params, "q")?.slice(0, 100),
    genre: genre && GENRES.includes(genre) ? genre : undefined,
    season: pick(one(params, "season"), SEASONS),
    year: Number.isInteger(year) && year >= 1940 && year <= 2100 ? year : undefined,
    format: pick(one(params, "format"), FORMATS),
    status: pick(one(params, "status"), STATUSES),
    sort: pick(one(params, "sort"), SORTS),
    page: Number.isInteger(page) && page > 1 && page <= 500 ? page : 1,
  };
}

export function filtersToQuery(filters: SearchFilters, overrides: Partial<SearchFilters> = {}): string {
  const merged = { ...filters, ...overrides };
  const qs = new URLSearchParams();
  if (merged.search) qs.set("q", merged.search);
  if (merged.genre) qs.set("genre", merged.genre);
  if (merged.season) qs.set("season", merged.season);
  if (merged.year) qs.set("year", String(merged.year));
  if (merged.format) qs.set("format", merged.format);
  if (merged.status) qs.set("status", merged.status);
  if (merged.sort) qs.set("sort", merged.sort);
  if (merged.page && merged.page > 1) qs.set("page", String(merged.page));
  const s = qs.toString();
  return s ? `?${s}` : "";
}
