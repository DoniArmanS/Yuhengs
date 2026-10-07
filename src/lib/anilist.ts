import { cacheLife } from "next/cache";
import type {
  AiringSlot,
  AnimeCard,
  AnimeDetail,
  MediaFormat,
  MediaSeason,
  MediaStatus,
  PageInfo,
} from "./types";

const ENDPOINT = "https://graphql.anilist.co";

const CARD_FIELDS = `
  id
  idMal
  title { romaji english }
  coverImage { extraLarge large color }
  format
  status
  episodes
  averageScore
  seasonYear
  genres
  nextAiringEpisode { episode airingAt }
`;

/** Genres offered as "channels" on the home page, each shown with its most popular covers. */
export const CHANNEL_GENRES = ["Action", "Romance", "Comedy", "Fantasy", "Slice of Life", "Mystery", "Sci-Fi", "Sports"];

async function query<T>(document: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: document, variables }),
  });

  if (res.status === 429) {
    throw new Error("AniList is rate limiting requests. Try again in a minute.");
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string; status?: number }[] };

  if (json.errors?.length) {
    // A 404 from AniList means the id doesn't exist; let callers treat it as "not found".
    if (json.errors.every((e) => e.status === 404)) return { Media: null } as T;
    throw new Error(`AniList: ${json.errors.map((e) => e.message).join(", ")}`);
  }

  return json.data as T;
}

export function currentSeason(date = new Date()): { season: MediaSeason; year: number } {
  const month = date.getUTCMonth();
  const season: MediaSeason =
    month <= 1 || month === 11 ? "WINTER" : month <= 4 ? "SPRING" : month <= 7 ? "SUMMER" : "FALL";
  // December belongs to next year's winter season on AniList.
  const year = month === 11 ? date.getUTCFullYear() + 1 : date.getUTCFullYear();
  return { season, year };
}

/** Latest year worth offering in filters (next year's announcements included). */
export async function getMaxFilterYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getUTCFullYear() + 1;
}

export async function getHomeCollections() {
  "use cache";
  cacheLife("hours");

  const { season, year } = currentSeason();

  const data = await query<{
    trending: { media: AnimeCard[] };
    seasonal: { media: AnimeCard[] };
    popular: { media: AnimeCard[] };
    topRated: { media: AnimeCard[] };
  } & Record<string, { media: { id: number; coverImage: { large: string | null; color: string | null } }[] }>>(
    `query ($season: MediaSeason, $year: Int) {
      trending: Page(page: 1, perPage: 18) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) { ${CARD_FIELDS} }
      }
      seasonal: Page(page: 1, perPage: 18) {
        media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) { ${CARD_FIELDS} }
      }
      popular: Page(page: 1, perPage: 18) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) { ${CARD_FIELDS} }
      }
      topRated: Page(page: 1, perPage: 18) {
        media(type: ANIME, sort: SCORE_DESC, isAdult: false) { ${CARD_FIELDS} }
      }
      ${CHANNEL_GENRES.map(
        (g, i) => `g${i}: Page(page: 1, perPage: 10) {
          media(type: ANIME, genre: "${g}", sort: POPULARITY_DESC, isAdult: false) { id coverImage { large color } }
        }`,
      ).join("\n")}
    }`,
    { season, year },
  );

  return {
    trending: data.trending.media,
    seasonal: data.seasonal.media,
    popular: data.popular.media,
    topRated: data.topRated.media,
    channels: pickChannelCovers(CHANNEL_GENRES.map((_, i) => data[`g${i}`].media)).map((covers, i) => ({
      genre: CHANNEL_GENRES[i],
      covers,
    })),
    season,
    year,
  };
}

/** Three covers per genre, skipping shows an earlier genre already used, so tiles don't repeat. */
function pickChannelCovers(lists: { id: number; coverImage: { large: string | null; color: string | null } }[][]) {
  const used = new Set<number>();
  return lists.map((list) => {
    const fresh = list.filter((m) => !used.has(m.id)).slice(0, 3);
    fresh.forEach((m) => used.add(m.id));
    return fresh.map((m) => ({ url: m.coverImage.large, color: m.coverImage.color }));
  });
}

/** Synopses and banners for a handful of shows (the home spotlight). */
export async function getBlurbs(ids: number[]): Promise<Record<number, { description: string | null; bannerImage: string | null }>> {
  "use cache";
  cacheLife("hours");

  if (ids.length === 0) return {};
  const data = await query<{ Page: { media: { id: number; description: string | null; bannerImage: string | null }[] } }>(
    `query ($ids: [Int]) {
      Page(perPage: 10) { media(id_in: $ids, type: ANIME) { id description(asHtml: false) bannerImage } }
    }`,
    { ids },
  );
  return Object.fromEntries(data.Page.media.map((m) => [m.id, { description: m.description, bannerImage: m.bannerImage }]));
}

export async function getAnime(id: number): Promise<AnimeDetail | null> {
  "use cache";
  cacheLife("hours");

  const data = await query<{ Media: AnimeDetail | null }>(
    `query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${CARD_FIELDS}
        title { romaji english native }
        bannerImage
        description(asHtml: false)
        duration
        genres
        season
        popularity
        studios(isMain: true) { nodes { name } }
        relations {
          edges {
            relationType(version: 2)
            node { ${CARD_FIELDS} type }
          }
        }
        recommendations(perPage: 12, sort: RATING_DESC) {
          nodes { mediaRecommendation { ${CARD_FIELDS} } }
        }
      }
    }`,
    { id },
  );

  return data.Media;
}

export interface SearchFilters {
  search?: string;
  genre?: string;
  season?: MediaSeason;
  year?: number;
  format?: MediaFormat;
  status?: MediaStatus;
  sort?: string;
  page?: number;
}

export async function searchAnime(filters: SearchFilters) {
  "use cache";
  cacheLife("hours");

  const sort = filters.sort ?? (filters.search ? "SEARCH_MATCH" : "POPULARITY_DESC");

  const data = await query<{ Page: { pageInfo: PageInfo; media: AnimeCard[] } }>(
    `query ($page: Int, $search: String, $genre: String, $season: MediaSeason, $year: Int,
            $format: MediaFormat, $status: MediaStatus, $sort: [MediaSort]) {
      Page(page: $page, perPage: 30) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: ANIME, isAdult: false, search: $search, genre: $genre, season: $season,
              seasonYear: $year, format: $format, status: $status, sort: $sort) {
          ${CARD_FIELDS}
        }
      }
    }`,
    {
      page: filters.page ?? 1,
      search: filters.search || undefined,
      genre: filters.genre,
      season: filters.season,
      year: filters.year,
      format: filters.format,
      status: filters.status,
      sort: [sort],
    },
  );

  return data.Page;
}

const AIRING_FIELDS = `
  airingAt
  episode
  media { ${CARD_FIELDS} bannerImage popularity genres isAdult }
`;

async function getAiringBetween(from: number, to: number): Promise<AiringSlot[]> {
  const slots: AiringSlot[] = [];
  for (let page = 1; page <= 8; page++) {
    const data = await query<{
      Page: { pageInfo: { hasNextPage: boolean }; airingSchedules: AiringSlot[] };
    }>(
      `query ($page: Int, $from: Int, $to: Int) {
        Page(page: $page, perPage: 50) {
          pageInfo { hasNextPage }
          airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) { ${AIRING_FIELDS} }
        }
      }`,
      { page, from, to },
    );
    slots.push(...data.Page.airingSchedules.filter((s) => !s.media.isAdult));
    if (!data.Page.pageInfo.hasNextPage) break;
  }
  return slots;
}

/**
 * What's airing around now: the last 36 hours and the next 24. Refreshed every
 * few minutes so "just aired" stays current; the client splits past from
 * upcoming using its own clock.
 */
export async function getBroadcast(): Promise<{ slots: AiringSlot[]; fetchedAt: number }> {
  "use cache";
  cacheLife("minutes");

  const now = Math.floor(Date.now() / 1000);
  const slots = await getAiringBetween(now - 36 * 3600, now + 24 * 3600);
  return { slots, fetchedAt: now };
}

export async function getWeekSchedule(): Promise<{ slots: AiringSlot[]; fetchedAt: number }> {
  "use cache";
  cacheLife("hours");

  // Start a day early so every viewer timezone sees a complete "today".
  const now = Math.floor(Date.now() / 1000);
  const slots = await getAiringBetween(now - 86_400, now + 7 * 86_400);
  return { slots, fetchedAt: now };
}
