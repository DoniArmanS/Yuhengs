import Link from "next/link";
import type { MangaCard as MangaCardData } from "@/lib/manga/format";
import { ScrollRow } from "../scroll-row";
import { MangaCard } from "./manga-card";

/** A manga caption box: a slanted ink block holding the title, like a narration panel. */
export function MangaHeading({
  id,
  title,
  description,
  href,
  linkLabel = "See all",
}: {
  id?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        <h2 id={id} className="condensed inline-block -skew-x-8 bg-frame px-3 pt-1 pb-1.5 text-2xl leading-none font-extrabold text-ink sm:text-[1.75rem]">
          <span className="inline-block skew-x-8">{title}</span>
        </h2>
        <span className="h-0.5 flex-1 bg-frame/30" aria-hidden />
        {href ? (
          <Link href={href} className="-my-2 inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-dim underline-offset-4 hover:text-paper hover:underline">
            {linkLabel}
          </Link>
        ) : null}
      </div>
      {description ? <p className="mt-2 text-sm text-dim">{description}</p> : null}
    </div>
  );
}

export function MangaRow({ title, description, href, items }: { title: string; description?: string; href?: string; items: MangaCardData[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto mt-14 max-w-[1400px] px-4 sm:px-6 lg:px-10">
      <MangaHeading title={title} description={description} href={href} />
      <ScrollRow label={title}>
        {items.map((manga) => (
          <li key={manga.id} className="w-[42vw] max-w-[190px] shrink-0 snap-start pr-1 pb-2 sm:w-[180px]">
            <MangaCard manga={manga} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}

export function RowSkeleton({ title }: { title: string }) {
  return (
    <section className="mx-auto mt-14 max-w-[1400px] px-4 sm:px-6 lg:px-10" aria-busy="true">
      <MangaHeading title={title} />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="w-[42vw] max-w-[190px] shrink-0 sm:w-[180px]">
            <div className="aspect-[2/3] animate-pulse border-2 border-rule bg-panel" />
            <div className="mt-3 h-4 w-3/4 animate-pulse bg-panel" />
          </div>
        ))}
      </div>
    </section>
  );
}
