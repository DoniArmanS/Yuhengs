import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "./section-heading";

interface Channel {
  genre: string;
  covers: { url: string | null; color: string | null }[];
}

// Resting and hover poses for the three fanned covers (front to back).
const FAN = [
  "right-2 rotate-[4deg] sm:right-4 group-hover:rotate-[7deg]",
  "right-9 rotate-[-4deg] sm:right-14 sm:group-hover:right-20 group-hover:rotate-[-8deg]",
  "right-24 rotate-[-10deg] group-hover:right-36 group-hover:rotate-[-15deg]",
];

/**
 * Genres as TV channels: the tile is lit by its top show's art and colour,
 * with that genre's three most popular covers fanned on the right.
 */
export function GenreChannels({ channels }: { channels: Channel[] }) {
  return (
    <section aria-labelledby="channels" className="mx-auto mt-16 max-w-[1400px] px-4 sm:px-6 lg:px-10">
      <SectionHeading id="channels" title="Channels" description="Tune in by genre" href="/search" linkLabel="All genres" />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {channels.map((ch, i) => {
          const lead = ch.covers[0];
          return (
            <li key={ch.genre}>
              <Link
                href={`/search?genre=${encodeURIComponent(ch.genre)}`}
                className="group relative isolate flex h-32 overflow-hidden rounded-[4px] border border-paper/10 p-3.5 sm:h-40 sm:p-5 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-paper/40 hover:shadow-[0_20px_50px_-20px_var(--ambient)] sm:h-44"
                style={{ ["--ambient" as string]: lead?.color ?? "#3a4866" }}
              >
                {/* Lead show's art, blurred into a lit backdrop */}
                {lead?.url ? (
                  <Image
                    src={lead.url}
                    alt=""
                    fill
                    sizes="360px"
                    className="-z-30 scale-125 object-cover opacity-75 blur-xl saturate-150 transition-opacity duration-300 group-hover:opacity-100"
                  />
                ) : null}
                <span className="absolute inset-0 -z-20 bg-[color-mix(in_oklab,var(--ambient)_22%,transparent)]" aria-hidden />
                <span className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/80 via-ink/25 to-transparent" aria-hidden />

                {ch.covers.map((c, j) =>
                  c.url ? (
                    <span
                      key={j}
                      className={`absolute top-1/2 -z-10 aspect-[2/3] h-[70%] -translate-y-1/2 sm:h-[82%] ${j === 2 ? "max-sm:hidden" : ""} overflow-hidden rounded-[3px] border border-paper/20 shadow-[0_12px_30px_-8px_rgb(0_0_0/0.8)] transition-all duration-500 ease-out ${FAN[j]}`}
                      style={{ zIndex: -10 + (3 - j) }}
                      aria-hidden
                    >
                      <Image src={c.url} alt="" fill sizes="110px" className="object-cover" />
                    </span>
                  ) : null,
                )}

                <span className="relative flex flex-col justify-between">
                  <span className="condensed flex items-center gap-1.5 text-xs font-bold text-paper/70 tabular-nums">
                    <span className="size-1.5 rounded-full bg-onair opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    CH {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="condensed max-w-[9ch] text-2xl leading-[0.9] font-extrabold text-balance drop-shadow-[0_2px_12px_rgb(0_0_0/0.6)] sm:text-3xl">
                    {ch.genre}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
