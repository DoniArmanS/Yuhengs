import Link from "next/link";
import type { AnimeCard as AnimeCardData } from "@/lib/types";
import { AnimeCard } from "./anime-card";
import { ScrollRow } from "./scroll-row";

export function AnimeRow({
  title,
  description,
  href,
  items,
}: {
  title: string;
  description?: string;
  href?: string;
  items: AnimeCardData[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto mt-14 max-w-[1400px] px-4 sm:px-6 lg:px-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="condensed text-3xl font-extrabold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-dim">{description}</p> : null}
        </div>
        {href ? (
          <Link href={href} className="shrink-0 text-sm font-semibold underline-offset-4 hover:underline">
            See all
          </Link>
        ) : null}
      </div>
      <ScrollRow label={title}>
        {items.map((anime) => (
          <li key={anime.id} className="w-[42vw] max-w-[190px] shrink-0 snap-start sm:w-[180px]">
            <AnimeCard anime={anime} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
