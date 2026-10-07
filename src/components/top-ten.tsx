import Image from "next/image";
import type { AnimeCard } from "@/lib/types";
import { displayTitle } from "@/lib/format";
import { IntentLink } from "./intent-link";
import { ScrollRow } from "./scroll-row";
import { SectionHeading } from "./section-heading";

/** Countdown-show chart of this week's most watched, with hollow rank numerals. */
export function TopTen({ items }: { items: AnimeCard[] }) {
  const ten = items.slice(0, 10);
  if (ten.length === 0) return null;

  return (
    <section aria-labelledby="top-ten" className="relative mt-16 overflow-hidden py-10">
      {/* A full-bleed band so the chart reads as its own segment. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-deep via-panel/60 to-ink-deep" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-onair/60 to-transparent" aria-hidden />
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <SectionHeading id="top-ten" title="Top 10 this week" description="Most watched on AniList right now" href="/search?sort=TRENDING_DESC" />
        <ScrollRow label="Top 10 this week">
          {ten.map((anime, i) => (
            <li key={anime.id} className="shrink-0 snap-start">
              <IntentLink href={`/anime/${anime.id}`} className="group flex items-end rounded-[3px] outline-offset-4">
                <span
                  className={`numeral -mr-5 text-[8.5rem] transition-[-webkit-text-stroke-color] duration-300 select-none group-hover:[-webkit-text-stroke-color:var(--color-onair)] sm:text-[10rem] ${
                    i === 0 ? "[-webkit-text-stroke-color:var(--color-guide)]" : ""
                  }`}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <span className="relative z-10 w-[120px] sm:w-[140px]">
                  <span
                    className="relative block aspect-[2/3] overflow-hidden rounded-[3px] border border-rule shadow-[0_18px_40px_-18px_rgb(0_0_0/0.9)] transition-colors duration-300 group-hover:border-paper/60"
                    style={{ backgroundColor: anime.coverImage.color ?? "var(--color-panel)" }}
                  >
                    {anime.coverImage.large ? (
                      <Image
                        src={anime.coverImage.extraLarge ?? anime.coverImage.large}
                        alt=""
                        fill
                        sizes="140px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                      />
                    ) : null}
                  </span>
                  <span className="sr-only">Number {i + 1}: </span>
                  <span className="mt-2 line-clamp-1 text-sm font-semibold group-hover:underline group-hover:underline-offset-4">
                    {displayTitle(anime)}
                  </span>
                </span>
              </IntentLink>
            </li>
          ))}
        </ScrollRow>
      </div>
    </section>
  );
}
