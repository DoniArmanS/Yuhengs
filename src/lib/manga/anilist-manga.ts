import { cacheLife } from "next/cache";
import { query } from "@/lib/anilist";
import type { PageInfo } from "@/lib/types";
import type { MangaCard, MangaDetail } from "./format";

export type { CountryOfOrigin, MangaCard, MangaDetail, RelatedMedia } from "./format";

const CARD = `
  id
  title { romaji english }
  coverImage { extraLarge large color }
  format
  status
  chapters
  averageScore
  countryOfOrigin
  genres
`;

export async function getMangaHome() {
  "use cache";
  cacheLife("hours");

  const data = await query<Record<"trending" | "manhwa" | "popular" | "topRated", { media: MangaCard[] }>>(
    `query {
      trending: Page(page: 1, perPage: 18) {
        media(type: MANGA, sort: TRENDING_DESC, isAdult: false, format_not: NOVEL) { ${CARD} }
      }
      manhwa: Page(page: 1, perPage: 18) {
        media(type: MANGA, sort: TRENDING_DESC, isAdult: false, format_not: NOVEL, countryOfOrigin: "KR") { ${CARD} }
      }
      popular: Page(page: 1, perPage: 18) {
        media(type: MANGA, sort: POPULARITY_DESC, isAdult: false, format_not: NOVEL) { ${CARD} }
      }
      topRated: Page(page: 1, perPage: 18) {
        media(type: MANGA, sort: SCORE_DESC, isAdult: false, format_not: NOVEL, popularity_greater: 5000) { ${CARD} }
      }
    }`,
  );

  return {
    trending: data.trending.media,
    manhwa: data.manhwa.media,
    popular: data.popular.media,
    topRated: data.topRated.media,
  };
}

export async function getManga(id: number): Promise<MangaDetail | null> {
  "use cache";
  cacheLife("hours");

  const data = await query<{ Media: MangaDetail | null }>(
    `query ($id: Int) {
      Media(id: $id, type: MANGA) {
        ${CARD}
        title { romaji english native }
        synonyms
        bannerImage
        description(asHtml: false)
        volumes
        isAdult
        startDate { year }
        staff(perPage: 4, sort: RELEVANCE) { edges { role node { name { full } } } }
        relations {
          edges {
            relationType(version: 2)
            node { id type format title { romaji english } coverImage { extraLarge large color }
                   episodes chapters status averageScore countryOfOrigin genres }
          }
        }
        recommendations(perPage: 12, sort: RATING_DESC) {
          nodes { mediaRecommendation { ${CARD} } }
        }
        externalLinks { url site type language }
      }
    }`,
    { id },
  );

  return data.Media;
}

export async function searchManga(search: string, page = 1) {
  "use cache";
  cacheLife("hours");

  const data = await query<{ Page: { pageInfo: PageInfo; media: MangaCard[] } }>(
    `query ($page: Int, $search: String) {
      Page(page: $page, perPage: 30) {
        pageInfo { total currentPage lastPage hasNextPage }
        media(type: MANGA, isAdult: false, format_not: NOVEL, search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC]) { ${CARD} }
      }
    }`,
    { page, search },
  );

  return data.Page;
}
