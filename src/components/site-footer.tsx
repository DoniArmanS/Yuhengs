import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-rule bg-ink-deep">
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
    </footer>
  );
}
