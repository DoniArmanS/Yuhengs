# Yuhengs

A free, non-commercial anime streaming fan site styled like a late-night TV channel: what just aired, what's on next, and everything else on AniList.

Built with Next.js 16 (App Router, Cache Components), React 19, TypeScript and Tailwind CSS 4. Anime data comes from the [AniList GraphQL API](https://docs.anilist.co); video plays from third-party embed servers. Nothing is hosted here.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run dev:lan    # HTTPS on your local network, for testing on a phone
npm run dev:clean  # clears the dev cache first; use it if styles ever look out of date
npm run build && npm start
```

Optional: set `NEXT_PUBLIC_SITE_URL` to your deployed URL so social previews resolve correctly.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Landing page with its own header: a full-screen poster wall with search, how it works, why Yuhengs, FAQ, and one way in ("Open Yuhengs" → `/home`) |
| `/home` | The dashboard: on air (the biggest new episode of the last day), just-aired list, a 24-hour "Coming up" guide, continue watching, seasonal / trending / popular / top-rated rows |
| `/search` | Title search with genre, season, year, format, status and sort filters (all in the URL) |
| `/anime/[id]` | Details, episode list, related titles and recommendations |
| `/watch/[id]/[episode]` | Player with server and sub/dub switching, episode list, prev/next |
| `/schedule` | This week's airing episodes in the viewer's local time |
| `/history` | Everything watched on this device |
| `/random` | Redirects to a random popular anime (the header's shuffle button) |

Watch history, your place in each episode and player preferences live in `localStorage`; there are no accounts yet.

### Manga

| Route | What it does |
| --- | --- |
| `/manga` | Manga dashboard: continue reading, newest uploads (Atsumaru's feed), trending manga and manhwa, popular, top rated |
| `/manga/[id]` | A series by AniList id: details, "Also an anime" link, official reading links, every chapter merged from all sources with a group filter |
| `/read/[id]/[chapter]` | Full-screen reader: single page (right-to-left or left-to-right) or long strip, page tone (normal / dim / night), upload picker |
| `/manga/search`, `/manga/library` | Manga search; everything you've started reading on this device |

The manga pages are open to everyone but marked `noindex`, so search engines leave them out. Anime pages link to the manga they were adapted from ("Read the manga"), and manga pages link back ("Also an anime").

Chapters come from [`src/lib/manga/`](src/lib/manga/), merged per chapter number in [`index.ts`](src/lib/manga/index.ts):

- **WeebCentral** (HTML) and **Bato** (`bato1.com`: JSON chapter list, HTML search and reader). Their image hosts serve pages to other sites, so these are read inside Yuhengs. Bato has no AniList ids and is matched by exact title and kind.
- **Atsumaru** (JSON API): every scanlation group, and each series' AniList and WeebCentral ids, so it drives the matching. Its image host refuses other sites, so its uploads are listed but open on atsu.moe.

Page images load in the viewer's browser straight from the source, with Yuhengs' real Referer: nothing is proxied through Vercel (its Acceptable Use Policy forbids proxying and hot-link hosting) and no header is faked. Each source can fail on its own, and the reader falls back to the next upload. Sites behind captchas or browser checks (comix.to, MangaFire, Comick, Kagane) are deliberately not used; if a source here starts blocking, switch it off rather than work around it.

## Streaming servers

Defined in [`src/lib/providers.ts`](src/lib/providers.ts), all keyed by AniList id, in fallback order: AniEmbed (default, runs in a sandboxed iframe so it can't open pop-ups), MegaPlay, VidNest. MegaPlay needs a secure page (HTTPS or localhost), which is why `dev:lan` serves HTTPS. Third-party embeds break without notice; re-test them and update that file when one stops working.

[`src/lib/embed-bridge.ts`](src/lib/embed-bridge.ts) holds each server's postMessage protocol (read from the players' own scripts), which powers resume-where-you-left-off, the next-episode countdown and MegaPlay's skip-intro. Every message is optional, so a server that changes its format only loses those extras. The site's security headers (including the `frame-src` allowlist built from the server list) are in [`next.config.ts`](next.config.ts).

## Design

Late-night broadcast in the Tokyo Night palette: night-city navy surfaces, a lavender on-air tally reserved for live and primary actions (with dark text on it), cyan for air times and scores, and one typeface (Archivo, self-hosted) whose width axis gives condensed titles and normal-width body text. Tokens live in [`src/app/globals.css`](src/app/globals.css); use `text-on-onair`, not `text-white`, on any `bg-onair` fill.

## Credits

Anime data and artwork from AniList. Yuhengs is not affiliated with AniList or any streaming provider.
