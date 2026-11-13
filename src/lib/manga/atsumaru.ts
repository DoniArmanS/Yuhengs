import "server-only";
import { cacheLife } from "next/cache";
import { cleanChapterTitle, getJson, normalizeTitle } from "./http";
import type { ChapterVersion } from "./types";

/*
 * Atsumaru (atsu.moe): an aggregator like comix.to. One series holds every
 * group's uploads, each group carries a community score, and series link to
 * their AniList and WeebCentral ids. Plain JSON endpoints, the same ones the
 * Mihon extension uses. Its image host (cdn.atsu.moe) refuses requests that
 * come from another site, so Yuhengs lists Atsumaru's uploads but doesn't
 * show their pages: those chapters open on atsu.moe.
 */
const BASE = "https://atsu.moe";

export interface SourceChapter {
  number: number;
  title: string | null;
  version: ChapterVersion;
}

interface SearchDoc {
  id: string;
  title: string;
  englishTitle?: string | null;
  isAdult?: boolean;
  chapterCount?: number | null;
  weebCentralId?: string | null;
}

interface MangaPage {
  id: string;
  title: string;
  /** A string in Atsumaru's JSON ("30013"). */
  anilistId?: string | number | null;
  scanlators?: { id: string; name: string; score: number }[] | null;
}

interface ChapterDto {
  id: string;
  number: number;
  title?: string | null;
  scanlationMangaId?: string | null;
  createdAt?: number | string | null;
  pageCount?: number | null;
}

interface FeedItem {
  id: string;
  title: string;
  type?: string | null;
  isAdult?: boolean;
  updatedAt?: number | null;
}

export interface LatestUpdate {
  id: string;
  title: string;
  type: string | null;
  updatedAt: number | null;
}

export function atsumaruUrl(id: string): string {
  return `${BASE}/manga/${encodeURIComponent(id)}`;
}

/** Atsumaru's own reader for one chapter. */
export function atsumaruReadUrl(mangaId: string, chapterId: string): string {
  return `${BASE}/read/${encodeURIComponent(mangaId)}/${encodeURIComponent(chapterId)}`;
}

function toMs(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const ms = typeof value === "number" ? value : Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

async function search(q: string): Promise<SearchDoc[]> {
  "use cache";
  cacheLife("hours");

  const params = new URLSearchParams({
    q,
    query_by: "title,englishTitle,otherNames",
    query_by_weights: "4,3,2",
    num_typos: "2,1,1",
    page: "1",
    per_page: "5",
    filter_by: "hidden:!=true && isAdult:=false && medium:!=[`Novel`]",
  });
  const data = await getJson<{ hits?: { document: SearchDoc }[] }>(`${BASE}/collections/manga/documents/search?${params}`);
  // Adult entries are filtered by the query too; this guards against the filter changing.
  return (data.hits ?? []).map((h) => h.document).filter((d) => !d.isAdult);
}

function anilistIdOf(page: MangaPage): number | null {
  const n = Number(page.anilistId);
  return Number.isInteger(n) && n > 0 ? n : null;
}

async function getPage(id: string): Promise<MangaPage> {
  "use cache";
  cacheLife("hours");

  const data = await getJson<{ mangaPage: MangaPage }>(`${BASE}/api/manga/page?id=${encodeURIComponent(id)}`);
  return data.mangaPage;
}

export interface AtsumaruMatch {
  id: string;
  weebCentralId: string | null;
}

/**
 * The Atsumaru series for an AniList entry: among the search hits whose page
 * carries the same AniList id, the one with the most chapters (One Piece also
 * has a "(Color)" edition linked to the same id). For series Atsumaru hasn't
 * linked yet, a hit whose main title is exactly the same.
 */
export async function findAtsumaru(anilistId: number, titles: string[]): Promise<AtsumaruMatch | null> {
  "use cache";
  cacheLife("days");

  const wanted = new Set(titles.map(normalizeTitle).filter(Boolean));
  const checked = new Set<string>();
  const linked: SearchDoc[] = [];
  let sameTitle: SearchDoc | null = null;

  for (const title of titles.slice(0, 3)) {
    for (const doc of await search(title)) {
      if (checked.has(doc.id) || checked.size >= 8) continue;
      checked.add(doc.id);
      const linkedTo = anilistIdOf(await getPage(doc.id));
      if (linkedTo === anilistId) linked.push(doc);
      else if (!sameTitle && linkedTo === null && [doc.title, doc.englishTitle].some((n) => n && wanted.has(normalizeTitle(n)))) {
        sameTitle = doc;
      }
    }
    // The first title nearly always finds it; only search again when it didn't.
    if (linked.length) break;
  }

  const best = linked.sort((a, b) => (b.chapterCount ?? 0) - (a.chapterCount ?? 0))[0] ?? sameTitle;
  return best ? { id: best.id, weebCentralId: best.weebCentralId || null } : null;
}

/** Every upload of every chapter, with the group's name and score. */
export async function getAtsumaruChapters(mangaId: string): Promise<SourceChapter[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const [page, data] = await Promise.all([
    getPage(mangaId),
    getJson<{ chapters: ChapterDto[] }>(`${BASE}/api/manga/allChapters?mangaId=${encodeURIComponent(mangaId)}`),
  ]);
  const groups = new Map((page.scanlators ?? []).map((s) => [s.id, s]));

  return data.chapters
    .filter((c) => Number.isFinite(c.number))
    .map((c) => {
      const group = c.scanlationMangaId ? groups.get(c.scanlationMangaId) : undefined;
      return {
        number: c.number,
        title: cleanChapterTitle(c.title),
        version: {
          source: "atsumaru",
          id: c.id,
          mangaId,
          group: group?.name ?? "Unknown group",
          rank: group?.score ?? 0,
          date: toMs(c.createdAt),
          pages: c.pageCount ?? null,
        },
      };
    });
}

/** Series with new chapters, newest first, adult titles left out. */
export async function getAtsumaruLatest(limit = 24): Promise<LatestUpdate[]> {
  "use cache";
  cacheLife("minutes");

  const data = await getJson<{ items: FeedItem[] }>(`${BASE}/api/home2/recentlyUpdated?offset=0&limit=${limit}`);
  return data.items
    .filter((i) => !i.isAdult)
    .map((i) => ({
      id: i.id,
      title: i.title,
      type: i.type === "Manwha" ? "Manhwa" : (i.type ?? null),
      updatedAt: i.updatedAt ?? null,
    }));
}

/** The AniList id Atsumaru has for one of its series, if any. */
export async function atsumaruAnilistId(id: string): Promise<{ anilistId: number | null; title: string }> {
  const page = await getPage(id);
  return { anilistId: anilistIdOf(page), title: page.title };
}
