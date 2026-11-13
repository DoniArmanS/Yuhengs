import "server-only";
import { cacheLife } from "next/cache";
import { cleanChapterTitle, decodeEntities, getHtml, getJson, normalizeTitle } from "./http";
import type { SourceChapter } from "./atsumaru";
import type { PageImage } from "./types";

/*
 * Bato (bato1.com): a large aggregator with one upload per chapter. The
 * chapter list is JSON, search and the reader are server-rendered HTML (the
 * same requests the Mihon extension makes), and its image host serves pages
 * to other sites, so chapters can be read inside Yuhengs.
 *
 * Bato has no AniList ids, so a series is matched by exact title and kind.
 * Its pages carry an anti-bot script for automated browsers; plain requests
 * like these are served normally. If that changes, this source should be
 * switched off, not worked around.
 */
const BASE = "https://bato1.com";
const SLUG = /^[a-z0-9][a-z0-9-]{0,150}$/;

export function batoUrl(slug: string): string {
  return `${BASE}/manga/${slug}`;
}

interface SearchHit {
  slug: string;
  title: string;
  type: string | null;
}

async function search(keyword: string): Promise<SearchHit[]> {
  "use cache";
  cacheLife("hours");

  const html = await getHtml(`${BASE}/filter?keyword=${encodeURIComponent(keyword)}`);
  const hits: SearchHit[] = [];
  for (const [, unit] of html.matchAll(/<div class="unit item-">([\s\S]*?)<\/ul>/g)) {
    const link = unit.match(/<a href="https:\/\/bato1\.com\/manga\/([^"]+)">([^<]+)<\/a>/);
    if (!link || !SLUG.test(link[1])) continue;
    const type = unit.match(/class="type"[^>]*>\s*([^<]+?)\s*<\/a>/)?.[1] ?? null;
    hits.push({ slug: link[1], title: decodeEntities(link[2]), type });
  }
  return hits;
}

interface ChapterDto {
  chapter_name: string;
  chapter_slug: string;
  chapter_num: number | string;
  updated_at?: string | null;
}

export async function getBatoChapters(slug: string): Promise<SourceChapter[]> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 900, expire: 3600 });

  if (!SLUG.test(slug)) return [];
  const data = await getJson<{ data?: ChapterDto[] }>(`${BASE}/get-chapter-list?slug=${slug}`);
  return (data.data ?? []).flatMap((c) => {
    const number = Number(c.chapter_num);
    if (!Number.isFinite(number) || !SLUG.test(c.chapter_slug)) return [];
    const date = c.updated_at ? Date.parse(c.updated_at) : NaN;
    return [
      {
        number,
        title: cleanChapterTitle(c.chapter_name),
        version: {
          source: "bato" as const,
          id: c.chapter_slug,
          mangaId: slug,
          group: "Bato",
          rank: 0,
          date: Number.isFinite(date) ? date : null,
          pages: null,
        },
      },
    ];
  });
}

/**
 * The Bato series with exactly one of the AniList titles and the same kind
 * (manga, manhwa or manhua). Bato sometimes lists a series twice under its
 * English and Japanese names; the one with more chapters wins.
 */
export async function findBato(titles: string[], kind: string): Promise<string | null> {
  "use cache";
  cacheLife("days");

  const wanted = new Set(titles.map(normalizeTitle).filter(Boolean));
  const matches = new Set<string>();
  for (const title of titles.slice(0, 2)) {
    for (const hit of await search(title)) {
      const sameKind = !hit.type || hit.type.toLowerCase() === kind.toLowerCase();
      if (sameKind && wanted.has(normalizeTitle(hit.title))) matches.add(hit.slug);
    }
  }

  const slugs = [...matches].slice(0, 3);
  if (slugs.length <= 1) return slugs[0] ?? null;
  const counts = await Promise.all(slugs.map(async (slug) => (await getBatoChapters(slug)).length));
  return slugs[counts.indexOf(Math.max(...counts))];
}

export async function getBatoPages(slug: string, chapterSlug: string): Promise<PageImage[]> {
  "use cache";
  cacheLife("days");

  if (!SLUG.test(slug) || !SLUG.test(chapterSlug)) return [];
  const html = await getHtml(`${BASE}/read/${slug}/${chapterSlug}`);
  const pages: { n: number; url: string }[] = [];
  // Page images are numbered; the site's own notice banner is "notice".
  for (const [tag, n] of html.matchAll(/<img\s+data-number='(\d+)'[^>]*>/g)) {
    const url = tag.match(/data-src='(https:\/\/[^']+)'/)?.[1] ?? tag.match(/\ssrc='(https:\/\/[^']+)'/)?.[1];
    if (url) pages.push({ n: Number(n), url: decodeEntities(url) });
  }
  return pages.sort((a, b) => a.n - b.n).map((p) => ({ url: p.url, width: null, height: null }));
}
