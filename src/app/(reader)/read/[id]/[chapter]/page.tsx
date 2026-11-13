import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getManga } from "@/lib/manga/anilist-manga";
import { defaultReadingMode, mangaTitle } from "@/lib/manga/format";
import { getChapterIndex, getPages } from "@/lib/manga";
import { atsumaruReadUrl } from "@/lib/manga/atsumaru";
import { canEmbed, chapterLabel, sourceLabel, versionParam, type ChapterVersion, type PageImage } from "@/lib/manga/types";
import { ExternalIcon } from "@/components/icons";
import { MangaReader } from "@/components/manga/manga-reader";

export async function generateMetadata(props: PageProps<"/read/[id]/[chapter]">): Promise<Metadata> {
  const { id, chapter } = await props.params;
  const manga = Number.isInteger(Number(id)) ? await getManga(Number(id)) : null;
  return { title: manga ? `${mangaTitle(manga)} · Chapter ${decodeURIComponent(chapter)}` : "Reader" };
}

export default function ReadPage(props: PageProps<"/read/[id]/[chapter]">) {
  return (
    <Suspense fallback={<ReaderLoading />}>
      <Reader params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

function versionLabel(v: ChapterVersion) {
  const source = sourceLabel(v.source);
  const label = v.group === source ? source : `${v.group} · ${source}`;
  return canEmbed(v.source) ? label : `${label} (opens there)`;
}

/** The asked-for upload first (?v= exact, ?g= same group), then the usual best-first order. */
function preferred(versions: ChapterVersion[], v: string | null, g: string | null): ChapterVersion[] {
  const exact = v ? versions.filter((x) => versionParam(x) === v) : [];
  const group = g ? versions.filter((x) => x.group === g) : [];
  return [...new Set([...exact, ...group, ...versions])];
}

async function Reader({ params, searchParams }: Pick<PageProps<"/read/[id]/[chapter]">, "params" | "searchParams">) {
  const [{ id, chapter }, query] = await Promise.all([params, searchParams]);
  const mangaId = Number(id);
  if (!Number.isInteger(mangaId) || mangaId <= 0) notFound();

  const manga = await getManga(mangaId);
  if (!manga || manga.isAdult) notFound();
  const title = mangaTitle(manga);

  const { chapters, sources } = await getChapterIndex(manga);
  const key = decodeURIComponent(chapter);
  const position = chapters.findIndex((c) => c.key === key);
  if (position === -1) {
    return (
      <ReaderMessage mangaId={mangaId} title={title}>
        {sources.some((s) => s.state === "error")
          ? `A source didn’t answer, so chapter ${key} couldn’t be found. Try again in a minute.`
          : `None of the sources have chapter ${key}.`}
      </ReaderMessage>
    );
  }

  const current = chapters[position];
  const wantedVersion = typeof query.v === "string" ? query.v : null;
  const wantedGroup = typeof query.g === "string" ? query.g : null;
  const order = preferred(current.versions, wantedVersion, wantedGroup);

  const newer = chapters[position - 1];
  const older = chapters[position + 1];

  // Uploads whose pages can be shown here; a broken one shouldn't stop the chapter, so try the next.
  const asked = wantedVersion || wantedGroup ? order[0] : null;
  const readable = asked && !canEmbed(asked.source) ? [] : order.filter((v) => canEmbed(v.source));
  let chosen: ChapterVersion | null = null;
  let pages: PageImage[] = [];
  for (const candidate of readable.slice(0, 4)) {
    try {
      const found = await getPages(candidate);
      if (found.length > 0) {
        chosen = candidate;
        pages = found;
        break;
      }
    } catch {
      // Try the next upload.
    }
  }

  if (!chosen) {
    // Atsumaru doesn't let other sites show its pages, so its uploads open there.
    const elsewhere = order.find((v) => v.source === "atsumaru");
    if (elsewhere) {
      return (
        <ReadElsewhere
          mangaId={mangaId}
          title={title}
          chapter={chapterLabel(current)}
          group={elsewhere.group}
          href={atsumaruReadUrl(elsewhere.mangaId, elsewhere.id)}
          tried={readable.length > 0}
          olderHref={older ? `/read/${mangaId}/${older.key}` : null}
          newerHref={newer ? `/read/${mangaId}/${newer.key}` : null}
        />
      );
    }
    return (
      <ReaderMessage mangaId={mangaId} title={title}>
        None of the uploads of {chapterLabel(current)} loaded right now. Try again in a minute.
      </ReaderMessage>
    );
  }

  // Once you pick a group, the next and previous chapters stay with it when they can.
  const keep = wantedVersion || wantedGroup ? `?g=${encodeURIComponent(chosen.group)}` : "";

  return (
    <MangaReader
      key={`${current.key}:${versionParam(chosen)}`}
      manga={{
        id: mangaId,
        title,
        cover: manga.coverImage.large ?? manga.coverImage.extraLarge,
        color: manga.coverImage.color,
        defaultMode: defaultReadingMode(manga.countryOfOrigin),
      }}
      chapter={{ key: current.key, label: chapterLabel(current) }}
      version={{ param: versionParam(chosen), label: versionLabel(chosen) }}
      versions={current.versions.map((v) => ({ param: versionParam(v), label: versionLabel(v) }))}
      fallbackFrom={chosen === readable[0] ? null : versionLabel(readable[0])}
      pages={pages}
      olderHref={older ? `/read/${mangaId}/${older.key}${keep}` : null}
      newerHref={newer ? `/read/${mangaId}/${newer.key}${keep}` : null}
      newerKey={newer?.key ?? null}
      chapterKeys={chapters.map((c) => c.key)}
    />
  );
}

function ReaderMessage({ mangaId, title, children }: { mangaId: number; title: string; children: React.ReactNode }) {
  return (
    <div className="tone grid min-h-dvh place-items-center px-4">
      <div className="ink-frame max-w-md bg-panel p-6 text-center">
        <p className="font-bold">{title}</p>
        <p className="mt-2 text-sm text-dim">{children}</p>
        <Link href={`/manga/${mangaId}`} className="mt-5 inline-flex h-11 items-center border-2 border-frame bg-onair px-4 font-bold text-on-onair hover:bg-onair-hover">
          Back to chapters
        </Link>
      </div>
    </div>
  );
}

/** A chapter only Atsumaru has: Yuhengs keeps your place in the list, the pages open on atsu.moe. */
function ReadElsewhere(props: {
  mangaId: number;
  title: string;
  chapter: string;
  group: string;
  href: string;
  tried: boolean;
  olderHref: string | null;
  newerHref: string | null;
}) {
  return (
    <div className="tone grid min-h-dvh place-items-center px-4 py-10">
      <div className="ink-frame w-full max-w-md bg-panel p-6 text-center">
        <p className="text-xs font-extrabold tracking-[0.18em] text-onair uppercase">On Atsumaru</p>
        <p className="condensed mt-2 text-3xl leading-tight font-extrabold">{props.chapter}</p>
        <p className="mt-1 text-sm text-dim">
          {props.title} · {props.group}
        </p>
        <p className="mt-4 text-sm text-dim">
          {props.tried
            ? "The other uploads didn’t load, and Atsumaru doesn’t let other sites show its pages."
            : "Only Atsumaru has this upload, and it doesn’t let other sites show its pages."}{" "}
          It opens in a new tab.
        </p>
        <a
          href={props.href}
          target="_blank"
          rel="noreferrer"
          className="ink-frame mt-5 inline-flex h-12 items-center gap-2 bg-onair px-5 font-bold text-on-onair hover:bg-onair-hover"
        >
          Read on Atsumaru
          <ExternalIcon className="size-4" />
        </a>
        <div className="mt-6 flex items-center justify-between gap-3 border-t-2 border-rule pt-4 text-sm font-semibold">
          {props.olderHref ? (
            <Link href={props.olderHref} className="inline-flex min-h-11 items-center text-dim underline-offset-4 hover:text-paper hover:underline">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <Link href={`/manga/${props.mangaId}`} className="inline-flex min-h-11 items-center text-dim underline-offset-4 hover:text-paper hover:underline">
            All chapters
          </Link>
          {props.newerHref ? (
            <Link href={props.newerHref} className="inline-flex min-h-11 items-center text-dim underline-offset-4 hover:text-paper hover:underline">
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
}

function ReaderLoading() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading chapter">
      <span className="flex items-center gap-2.5 text-sm text-dim">
        <span className="tuning size-2 rounded-full bg-onair" aria-hidden />
        Opening the chapter…
      </span>
    </div>
  );
}
