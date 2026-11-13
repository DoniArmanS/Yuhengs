import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getManga } from "@/lib/manga/anilist-manga";
import { mangaKind, mangaStatus, mangaTitle, type MangaCard, type MangaDetail } from "@/lib/manga/format";
import { getChapterIndex, type ChapterIndex } from "@/lib/manga";
import { sourceLabel } from "@/lib/manga/types";
import { plainDescription } from "@/lib/format";
import { ExpandableText } from "@/components/expandable-text";
import { ChapterList, type ChapterRow } from "@/components/manga/chapter-list";
import { KindBadge } from "@/components/manga/manga-card";
import { MangaHeading, MangaRow } from "@/components/manga/manga-heading";
import { ReadCta } from "@/components/manga/read-cta";
import { ExternalIcon, PlayIcon, StarIcon } from "@/components/icons";

export async function generateMetadata(props: PageProps<"/manga/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const manga = Number.isInteger(Number(id)) ? await getManga(Number(id)) : null;
  if (!manga) return { title: "Not found" };
  return { title: `Read ${mangaTitle(manga)}`, description: plainDescription(manga.description).slice(0, 160) };
}

export default function MangaPage(props: PageProps<"/manga/[id]">) {
  return (
    <Suspense fallback={<TitleSkeleton />}>
      <MangaDetailView params={props.params} />
    </Suspense>
  );
}

async function MangaDetailView({ params }: Pick<PageProps<"/manga/[id]">, "params">) {
  const { id } = await params;
  const mangaId = Number(id);
  if (!Number.isInteger(mangaId) || mangaId <= 0) notFound();

  const manga = await getManga(mangaId);
  if (!manga || manga.isAdult) notFound();

  // One lookup across the sources, shared by the read button and the chapter list.
  const index = getChapterIndex(manga);

  const title = mangaTitle(manga);
  const kind = mangaKind(manga.countryOfOrigin);
  const description = plainDescription(manga.description);
  const authors = [...new Set(manga.staff.edges.filter((e) => /story|art|original/i.test(e.role)).map((e) => e.node.name.full))];
  const anime = manga.relations.edges.find((e) => e.relationType === "ADAPTATION" && e.node.type === "ANIME")?.node;
  const related = manga.relations.edges
    .filter((e) => e.node.type === "MANGA" && e.node.format !== "NOVEL")
    .map((e) => e.node as unknown as MangaCard);
  const recommended = manga.recommendations.nodes.map((n) => n.mediaRecommendation).filter((m): m is MangaCard => m !== null);
  const official = manga.externalLinks.filter((l) => l.type === "STREAMING" && (!l.language || l.language === "English"));
  const meta = [mangaStatus(manga.status), manga.startDate.year, manga.chapters ? `${manga.chapters} chapters` : null, manga.volumes ? `${manga.volumes} volumes` : null].filter(Boolean);

  return (
    <article>
      <div className="relative h-[200px] overflow-hidden border-b-2 border-frame sm:h-[280px]" aria-hidden>
        {manga.bannerImage ? (
          <Image src={manga.bannerImage} alt="" fill preload sizes="100vw" className="object-cover object-[center_35%] contrast-125 grayscale" />
        ) : (
          <div className="absolute inset-0" style={{ backgroundColor: manga.coverImage.color ?? "var(--color-panel)" }} />
        )}
        <div className="absolute inset-0 bg-ink/45" />
        <div className="tone absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto -mt-24 grid max-w-[1400px] gap-8 px-4 sm:-mt-32 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 lg:px-10">
        <div
          className="ink-frame relative aspect-[2/3] w-36 -rotate-[1.5deg] overflow-hidden bg-panel shadow-[6px_6px_0_var(--color-shadow)] sm:w-44 md:w-full"
          style={{ backgroundColor: manga.coverImage.color ?? undefined }}
        >
          {manga.coverImage.extraLarge ? (
            <Image src={manga.coverImage.extraLarge} alt={`${title} cover`} fill preload sizes="(min-width: 1024px) 250px, (min-width: 768px) 220px, 176px" className="object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 md:pt-28 lg:pt-36">
          <div className="flex flex-wrap items-center gap-3">
            <KindBadge kind={kind} />
            {manga.averageScore ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-onair">
                <StarIcon className="size-4" />
                {manga.averageScore}% liked
              </span>
            ) : null}
            <span className="text-sm text-dim">{meta.join(" · ")}</span>
          </div>
          <h1 className="condensed mt-3 text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95] font-extrabold text-balance">{title}</h1>
          {manga.title.english && manga.title.romaji && manga.title.english !== manga.title.romaji ? (
            <p className="mt-2 text-sm text-dim">{[manga.title.romaji, manga.title.native].filter(Boolean).join("  /  ")}</p>
          ) : null}
          {authors.length ? <p className="mt-2 text-sm text-dim">By {authors.join(", ")}</p> : null}

          <div className="mt-6">
            <Suspense fallback={<CtaLoading />}>
              <ReadButtons mangaId={manga.id} index={index} />
            </Suspense>
          </div>

          {description ? (
            <ExpandableText paragraphs={description.split(/\n+/)} className="mt-6 max-w-[68ch] leading-relaxed text-paper/85" />
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {manga.genres.map((g) => (
              <span key={g} className="border-2 border-rule-strong px-2.5 py-1 text-xs font-semibold text-dim">
                {g}
              </span>
            ))}
          </div>

          <div className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
            {anime ? <AnimeCardLink anime={anime} /> : null}
            {official.length ? (
              <div className="ink-frame bg-panel p-4">
                <p className="text-xs font-extrabold tracking-wider text-onair uppercase">Read officially</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {official.slice(0, 4).map((l) => (
                    <li key={l.url}>
                      <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 border-2 border-frame px-3 text-sm font-semibold hover:bg-panel-raised">
                        {l.site}
                        <ExternalIcon className="size-3.5" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="mx-auto mt-14 max-w-[1400px] px-4 sm:px-6 lg:px-10" aria-labelledby="chapters">
        <Suspense fallback={<ChaptersLoading />}>
          <Chapters mangaId={manga.id} index={index} />
        </Suspense>
      </section>

      <MangaRow title="Same series" items={related} />
      <MangaRow title="If you liked this" items={recommended} />
    </article>
  );
}

function AnimeCardLink({ anime }: { anime: MangaDetail["relations"]["edges"][number]["node"] }) {
  const cover = anime.coverImage.large ?? anime.coverImage.extraLarge;
  return (
    <Link href={`/anime/${anime.id}`} className="ink-frame group relative flex items-center gap-3 bg-panel p-3 pt-5">
      <span className="absolute -top-3.5 left-3 rounded-full border-2 border-frame bg-paper px-3 py-0.5 text-sm font-extrabold text-ink">
        Also an anime!
      </span>
      {cover ? (
        <span className="relative h-16 w-11 shrink-0 overflow-hidden border-2 border-frame">
          <Image src={cover} alt="" fill sizes="44px" className="object-cover" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block font-bold group-hover:underline group-hover:underline-offset-4">Watch the anime</span>
        <span className="block truncate text-xs text-dim">
          {anime.title.english || anime.title.romaji}
          {anime.episodes ? ` · ${anime.episodes} episodes` : ""}
        </span>
      </span>
      <span className="grid size-10 shrink-0 place-items-center bg-frame text-ink" aria-hidden>
        <PlayIcon className="size-4 translate-x-px" />
      </span>
    </Link>
  );
}

async function ReadButtons({ mangaId, index }: { mangaId: number; index: Promise<ChapterIndex> }) {
  const { chapters } = await index;
  if (chapters.length === 0) return null;
  return <ReadCta mangaId={mangaId} first={chapters[chapters.length - 1].key} latest={chapters[0].key} />;
}

async function Chapters({ mangaId, index }: { mangaId: number; index: Promise<ChapterIndex> }) {
  const { chapters, sources } = await index;

  const groups: string[] = [];
  const groupIndex = new Map<string, number>();
  const rows: ChapterRow[] = chapters.map((c) => [
    c.key,
    c.title,
    c.date,
    [...new Set(c.versions.map((v) => v.group))].map((g) => {
      if (!groupIndex.has(g)) groupIndex.set(g, groups.push(g) - 1);
      return groupIndex.get(g)!;
    }),
  ]);

  return (
    <>
      <MangaHeading id="chapters" title="Chapters" description={chapters.length ? `${chapters.length} chapters, merged from every source.` : undefined} />
      <p className="-mt-3 mb-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-dim">
        {sources.map((s) => (
          <span key={s.source}>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer" className="font-semibold text-paper underline-offset-2 hover:underline">
                {sourceLabel(s.source)}
              </a>
            ) : (
              <span className="font-semibold">{sourceLabel(s.source)}</span>
            )}
            {" · "}
            {s.state === "ok" ? `${s.chapters} chapters` : s.state === "not-found" ? "doesn’t have it" : "didn’t answer"}
          </span>
        ))}
      </p>
      {chapters.length ? (
        <ChapterList mangaId={mangaId} rows={rows} groups={groups} />
      ) : (
        <p className="ink-frame bg-panel px-4 py-4 text-sm text-dim">
          {sources.some((s) => s.state === "error")
            ? "A source didn’t answer, so no chapters could be listed. Try again in a minute."
            : "None of the sources have chapters for this one yet."}
        </p>
      )}
    </>
  );
}

function CtaLoading() {
  return (
    <span className="inline-flex h-12 items-center gap-2.5 border-2 border-rule-strong px-5 text-sm text-dim" role="status">
      <span className="tuning size-2 rounded-full bg-onair" aria-hidden />
      Finding chapters…
    </span>
  );
}

function ChaptersLoading() {
  return (
    <div aria-busy="true">
      <MangaHeading title="Chapters" />
      <p className="-mt-3 mb-5 text-xs text-dim" role="status">
        Checking WeebCentral, Bato and Atsumaru…
      </p>
      <div className="ink-frame divide-y-2 divide-rule bg-panel">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 px-4 py-3">
            <div className="h-4 w-40 animate-pulse bg-panel-raised" />
            <div className="h-3 w-56 animate-pulse bg-panel-raised" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TitleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading manga">
      <div className="h-[200px] animate-pulse border-b-2 border-frame bg-panel sm:h-[280px]" />
      <div className="relative mx-auto -mt-24 grid max-w-[1400px] gap-8 px-4 sm:-mt-32 sm:px-6 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] lg:px-10">
        <div className="aspect-[2/3] w-36 animate-pulse border-2 border-frame bg-panel-raised sm:w-44 md:w-full" />
        <div className="space-y-4 md:pt-36">
          <div className="h-10 w-2/3 animate-pulse bg-panel-raised" />
          <div className="h-4 w-1/3 animate-pulse bg-panel" />
          <div className="h-12 w-56 animate-pulse bg-panel-raised" />
        </div>
      </div>
    </div>
  );
}
