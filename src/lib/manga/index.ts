import "server-only";
import { atsumaruUrl, findAtsumaru, getAtsumaruChapters, type SourceChapter } from "./atsumaru";
import { batoUrl, findBato, getBatoChapters, getBatoPages } from "./bato";
import { findWeebCentral, getWeebCentralChapters, getWeebCentralPages, weebcentralUrl } from "./weebcentral";
import { mangaKind, type MangaDetail } from "./format";
import { chapterKey, SOURCES, type Chapter, type ChapterVersion, type PageImage, type SourceStatus } from "./types";

/*
 * One chapter list from every source. Atsumaru is looked up first because it
 * knows each series' AniList id and its WeebCentral id, so WeebCentral is
 * only searched when Atsumaru doesn't have the series; Bato is matched by
 * title. Each source can fail on its own: the list is built from whatever
 * answered, and the statuses say which ones didn't.
 */

function searchTitles(manga: Pick<MangaDetail, "title" | "synonyms">): string[] {
  const all = [manga.title.english, manga.title.romaji, ...manga.synonyms.slice(0, 2)];
  return [...new Set(all.filter((t): t is string => Boolean(t && t.trim())))];
}

const ORDER = new Map(SOURCES.map((s, i) => [s.id, i]));

function compareVersions(a: ChapterVersion, b: ChapterVersion): number {
  return (ORDER.get(a.source)! - ORDER.get(b.source)!) || b.rank - a.rank || (b.date ?? 0) - (a.date ?? 0);
}

function merge(lists: SourceChapter[][]): Chapter[] {
  const byKey = new Map<string, Chapter>();
  for (const list of lists) {
    for (const { number, title, version } of list) {
      const key = chapterKey(number);
      const chapter = byKey.get(key) ?? { key, number, title: null, date: null, versions: [] };
      chapter.title ??= title;
      if (version.date && (!chapter.date || version.date > chapter.date)) chapter.date = version.date;
      if (!chapter.versions.some((v) => v.source === version.source && v.id === version.id)) chapter.versions.push(version);
      byKey.set(key, chapter);
    }
  }
  const chapters = [...byKey.values()];
  chapters.forEach((c) => c.versions.sort(compareVersions));
  return chapters.sort((a, b) => b.number - a.number);
}

export interface ChapterIndex {
  chapters: Chapter[];
  sources: SourceStatus[];
}

type Lookup<T> = { ok: true; value: T | null } | { ok: false; value: null };

function settle<T>(promise: Promise<T | null>): Promise<Lookup<T>> {
  return promise.then(
    (value) => ({ ok: true as const, value }),
    () => ({ ok: false as const, value: null }),
  );
}

export async function getChapterIndex(
  manga: Pick<MangaDetail, "id" | "title" | "synonyms" | "countryOfOrigin">,
): Promise<ChapterIndex> {
  const titles = searchTitles(manga);

  const [atsu, bato] = await Promise.all([
    settle(findAtsumaru(manga.id, titles)),
    settle(findBato(titles, mangaKind(manga.countryOfOrigin))),
  ]);
  const wc: Lookup<string> = atsu.value?.weebCentralId
    ? { ok: true, value: atsu.value.weebCentralId }
    : await settle(findWeebCentral(manga.id, titles));

  const [wcChapters, batoChapters, atsuChapters] = await Promise.allSettled([
    wc.value ? getWeebCentralChapters(wc.value) : Promise.resolve(null),
    bato.value ? getBatoChapters(bato.value) : Promise.resolve(null),
    atsu.value ? getAtsumaruChapters(atsu.value.id) : Promise.resolve(null),
  ]);

  // Bato numbers re-uploads as 144.1, 144.2…; hundreds of them would bury the list. When another
  // source has the series, keep Bato's decimal chapters only if that source lists the number too.
  if (batoChapters.status === "fulfilled" && batoChapters.value) {
    const known = new Set(
      [wcChapters, atsuChapters].flatMap((r) => (r.status === "fulfilled" && r.value ? r.value.map((c) => chapterKey(c.number)) : [])),
    );
    if (known.size > 0) {
      batoChapters.value = batoChapters.value.filter((c) => Number.isInteger(c.number) || known.has(chapterKey(c.number)));
    }
  }

  const status = (
    source: SourceStatus["source"],
    lookup: Lookup<unknown>,
    result: PromiseSettledResult<SourceChapter[] | null>,
    url?: string,
  ): SourceStatus => {
    if (!lookup.ok || result.status === "rejected") return { source, state: "error", chapters: 0, url };
    if (!lookup.value || !result.value) return { source, state: "not-found", chapters: 0 };
    return { source, state: "ok", chapters: new Set(result.value.map((c) => c.number)).size, url };
  };

  return {
    chapters: merge(
      [wcChapters, batoChapters, atsuChapters].flatMap((r) => (r.status === "fulfilled" && r.value ? [r.value] : [])),
    ),
    sources: [
      status("weebcentral", wc, wcChapters, wc.value ? weebcentralUrl(wc.value) : undefined),
      status("bato", bato, batoChapters, bato.value ? batoUrl(bato.value) : undefined),
      status("atsumaru", atsu, atsuChapters, atsu.value ? atsumaruUrl(atsu.value.id) : undefined),
    ],
  };
}

/** Page images for an upload from a source whose pages may be shown here (see `canEmbed`). */
export async function getPages(version: ChapterVersion): Promise<PageImage[]> {
  if (version.source === "weebcentral") return getWeebCentralPages(version.id);
  if (version.source === "bato") return getBatoPages(version.mangaId, version.id);
  return [];
}
