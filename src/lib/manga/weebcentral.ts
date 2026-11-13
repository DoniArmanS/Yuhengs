import "server-only";
import { cacheLife } from "next/cache";
import { decodeEntities as decode, getHtml } from "./http";
import type { SourceChapter } from "./atsumaru";
import type { PageImage } from "./types";

/*
 * WeebCentral: the MangaSee successor. Server-rendered HTML fragments (the
 * same ones its htmx front end loads), one upload per chapter, images on
 * scans.lastation.us. The Mihon extension paces it to one request every two
 * seconds, so everything here is cached and only fetched when a page needs it.
 */
const BASE = "https://weebcentral.com";
const ID = /^[0-9A-Z]{26}$/;

export function weebcentralUrl(seriesId: string): string {
  return `${BASE}/series/${seriesId}`;
}

/** "Chapter 147", "Episode 12.5", "S2 Chapter 30" → the last number in the name. */
function numberFrom(name: string): number | null {
  const all = name.match(/\d+(?:\.\d+)?/g);
  if (!all) return null;
  const n = Number(all[all.length - 1]);
  return Number.isFinite(n) ? n : null;
}

/** The series page links its AniList entry under "Track". */
async function seriesAnilistId(seriesId: string): Promise<number | null> {
  "use cache";
  cacheLife("days");

  const html = await getHtml(`${BASE}/series/${seriesId}`);
  const match = html.match(/https:\/\/anilist\.co\/manga\/(\d+)/);
  return match ? Number(match[1]) : null;
}

/** Search WeebCentral for an AniList entry Atsumaru doesn't have. */
export async function findWeebCentral(anilistId: number, titles: string[]): Promise<string | null> {
  "use cache";
  cacheLife("days");

  for (const title of titles.slice(0, 2)) {
    const params = new URLSearchParams({
      text: title,
      limit: "8",
      offset: "0",
      display_mode: "Full Display",
      sort: "Best Match",
      order: "Descending",
      official: "Any",
      anime: "Any",
      adult: "False",
    });
    const html = await getHtml(`${BASE}/search/data?${params}`);
    const ids = [...new Set([...html.matchAll(/\/series\/([0-9A-Z]{26})\//g)].map((m) => m[1]))].slice(0, 3);
    for (const id of ids) {
      if ((await seriesAnilistId(id)) === anilistId) return id;
    }
  }
  return null;
}

export async function getWeebCentralChapters(seriesId: string): Promise<SourceChapter[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  if (!ID.test(seriesId)) return [];
  const html = await getHtml(`${BASE}/series/${seriesId}/full-chapter-list`);
  const rows = html.matchAll(/<a href="\/chapters\/([0-9A-Z]{26})"[^>]*>([\s\S]*?)<\/a>/g);
  const chapters: SourceChapter[] = [];
  for (const [, id, body] of rows) {
    const name = decode(body.match(/<span class="">([^<]+)<\/span>/)?.[1] ?? "");
    const number = numberFrom(name);
    if (number === null) continue;
    const official = /<img[^>]+src="[^"]*official[^"]*"/i.test(body);
    const datetime = body.match(/datetime="([^"]+)"/)?.[1];
    const date = datetime ? Date.parse(datetime) : NaN;
    chapters.push({
      number,
      // Names like "Chapter 147" carry nothing beyond the number.
      title: null,
      version: {
        source: "weebcentral",
        id,
        mangaId: seriesId,
        group: official ? "Official" : "WeebCentral",
        rank: official ? 1 : 0,
        date: Number.isFinite(date) ? date : null,
        pages: null,
      },
    });
  }
  return chapters;
}

export async function getWeebCentralPages(chapterId: string): Promise<PageImage[]> {
  "use cache";
  cacheLife("days");

  if (!ID.test(chapterId)) return [];
  const html = await getHtml(`${BASE}/chapters/${chapterId}/images?is_prev=False&reading_style=long_strip`);
  return [...html.matchAll(/<img[^>]+src="(https:\/\/[^"]+)"[^>]*>/g)]
    .map((m) => decode(m[1]))
    .filter((url) => !url.includes("/static/images/"))
    .map((url) => ({ url, width: null, height: null }));
}
