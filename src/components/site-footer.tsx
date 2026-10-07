import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-rule bg-ink-deep">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm leading-relaxed text-dim">
            A free, non-commercial fan project. Yuhengs doesn’t host any video; episodes play from
            third-party servers.
          </p>
        </div>

        <nav aria-label="Footer" className="flex flex-col gap-2 text-sm">
          <Link href="/" className="text-dim hover:text-paper">Home</Link>
          <Link href="/search" className="text-dim hover:text-paper">Browse all anime</Link>
          <Link href="/schedule" className="text-dim hover:text-paper">Airing schedule</Link>
        </nav>

        <p className="text-xs leading-relaxed text-faint">
          Anime data and artwork from{" "}
          <a href="https://anilist.co" className="text-dim underline-offset-2 hover:underline" rel="noreferrer" target="_blank">
            AniList
          </a>
          . Yuhengs is not affiliated with AniList or any streaming provider.
        </p>
      </div>
      {/* Station sign-off: the wordmark, huge and hollow, cropped by the page edge. */}
      <p
        aria-hidden
        className="numeral pointer-events-none -mb-[0.18em] px-4 text-center text-[clamp(5rem,19vw,16rem)] whitespace-nowrap select-none [-webkit-text-stroke-color:var(--color-rule)] [-webkit-text-stroke-width:1.5px]"
      >
        Yuhengs
      </p>
    </footer>
  );
}
