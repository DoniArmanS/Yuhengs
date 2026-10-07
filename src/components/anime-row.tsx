import type { AnimeCard as AnimeCardData } from "@/lib/types";
import { AnimeCard } from "./anime-card";
import { ScrollRow } from "./scroll-row";
import { SectionHeading } from "./section-heading";

export function AnimeRow({
  title,
  description,
  href,
  items,
  morphIds,
}: {
  title: string;
  description?: string;
  href?: string;
  items: AnimeCardData[];
  /** Ids whose posters may morph into the detail cover (first appearance on the page only). */
  morphIds?: ReadonlySet<number>;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-[1400px] px-4 sm:px-6 lg:px-10">
      <SectionHeading title={title} description={description} href={href} />
      <ScrollRow label={title}>
        {items.map((anime) => (
          <li key={anime.id} className="w-[42vw] max-w-[190px] shrink-0 snap-start sm:w-[180px]">
            <AnimeCard anime={anime} morph={morphIds?.has(anime.id) ?? false} />
          </li>
        ))}
      </ScrollRow>
    </section>
  );
}
