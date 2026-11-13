import Image from "next/image";
import Link from "next/link";
import { mangaKind, mangaStatus, mangaTitle, type MangaCard as MangaCardData } from "@/lib/manga/format";
import { StarIcon } from "../icons";

/**
 * Manga, manhwa and manhua told apart by badge shape (filled, outlined,
 * dashed) rather than colour, so the section keeps a single accent.
 */
export function KindBadge({ kind, className = "" }: { kind: "Manga" | "Manhwa" | "Manhua"; className?: string }) {
  const shape =
    kind === "Manga"
      ? "border-frame bg-frame text-ink"
      : kind === "Manhwa"
        ? "border-paper bg-ink text-paper"
        : "border-dashed border-paper bg-ink text-paper";
  return (
    <span className={`inline-flex items-center border-2 px-1.5 py-px text-[11px] leading-tight font-extrabold tracking-wide uppercase ${shape} ${className}`}>
      {kind}
    </span>
  );
}

export function MangaCard({
  manga,
  sizes = "(min-width: 1280px) 190px, (min-width: 640px) 22vw, 40vw",
}: {
  manga: MangaCardData;
  sizes?: string;
}) {
  const title = mangaTitle(manga);
  const cover = manga.coverImage.extraLarge ?? manga.coverImage.large;
  const detail = manga.chapters ? `${manga.chapters} ch.` : mangaStatus(manga.status);

  return (
    <Link href={`/manga/${manga.id}`} className="group block outline-offset-4">
      <div
        className="ink-frame relative aspect-[2/3] overflow-hidden bg-panel transition-[translate,box-shadow] duration-200 ease-out group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[6px_6px_0_var(--color-shadow)]"
        style={{ backgroundColor: manga.coverImage.color ?? undefined }}
      >
        {cover ? <Image src={cover} alt="" fill sizes={sizes} className="object-cover" /> : null}
        <KindBadge kind={mangaKind(manga.countryOfOrigin)} className="absolute top-2 left-2" />
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm leading-snug font-bold group-hover:underline group-hover:underline-offset-4">
        {title}
      </h3>
      <p className="mt-1 flex items-center gap-2.5 text-xs text-dim">
        {detail ? <span>{detail}</span> : null}
        {manga.averageScore ? (
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-onair tabular-nums">
            <StarIcon className="size-3" />
            {manga.averageScore}
          </span>
        ) : null}
      </p>
    </Link>
  );
}
