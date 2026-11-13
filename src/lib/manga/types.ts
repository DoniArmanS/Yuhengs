/**
 * The sites Yuhengs reads chapters from, in the order the reader prefers them.
 * `embed` says whether the site's image host lets other sites show its pages:
 * WeebCentral's and Bato's do. Atsumaru's refuses, so its uploads are listed
 * here but open on atsu.moe.
 */
export type SourceId = "weebcentral" | "bato" | "atsumaru";

export const SOURCES: { id: SourceId; label: string; home: string; embed: boolean }[] = [
  { id: "weebcentral", label: "WeebCentral", home: "https://weebcentral.com", embed: true },
  { id: "bato", label: "Bato", home: "https://bato1.com", embed: true },
  { id: "atsumaru", label: "Atsumaru", home: "https://atsu.moe", embed: false },
];

export function sourceLabel(id: SourceId): string {
  return SOURCES.find((s) => s.id === id)?.label ?? id;
}

export function canEmbed(id: SourceId): boolean {
  return SOURCES.find((s) => s.id === id)?.embed ?? false;
}

/** One upload of a chapter: a source, and the group that scanned it. */
export interface ChapterVersion {
  source: SourceId;
  /** The source's chapter id. */
  id: string;
  /** The source's id for the series, needed to fetch the pages. */
  mangaId: string;
  group: string;
  /** Higher is preferred: the source's own rating of the group. */
  rank: number;
  date: number | null;
  pages: number | null;
}

/** A chapter number with every upload of it, best first. */
export interface Chapter {
  /** "147" or "311.5": the chapter's URL segment. */
  key: string;
  number: number;
  title: string | null;
  /** Newest upload time. */
  date: number | null;
  versions: ChapterVersion[];
}

export interface SourceStatus {
  source: SourceId;
  state: "ok" | "not-found" | "error";
  chapters: number;
  url?: string;
}

export interface PageImage {
  url: string;
  width: number | null;
  height: number | null;
}

/** A version as a URL value, e.g. "atsumaru.BUWQY". */
export function versionParam(v: Pick<ChapterVersion, "source" | "id">): string {
  return `${v.source}.${v.id}`;
}

export function chapterKey(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export function chapterLabel(c: Pick<Chapter, "number" | "title">): string {
  return `Chapter ${chapterKey(c.number)}${c.title ? `: ${c.title}` : ""}`;
}
