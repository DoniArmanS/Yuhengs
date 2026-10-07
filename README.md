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
| `/` | On air (the biggest new episode of the last day), just-aired list, a 24-hour "Coming up" guide, continue watching, seasonal / trending / popular / top-rated rows |
| `/search` | Title search with genre, season, year, format, status and sort filters (all in the URL) |
| `/anime/[id]` | Details, episode list, related titles and recommendations |
| `/watch/[id]/[episode]` | Player with server and sub/dub switching, episode list, prev/next |
| `/schedule` | This week's airing episodes in the viewer's local time |

Watch history and player preferences live in `localStorage`; there are no accounts yet.

## Streaming servers

Defined in [`src/lib/providers.ts`](src/lib/providers.ts), all keyed by AniList id, in fallback order: AniEmbed (default, runs in a sandboxed iframe so it can't open pop-ups), MegaPlay, VidNest. MegaPlay needs a secure page (HTTPS or localhost), which is why `dev:lan` serves HTTPS. Third-party embeds break without notice; re-test them and update that file when one stops working.

## Design

Late-night broadcast: monitor-navy surfaces, a red on-air tally reserved for live and primary actions, amber for air times and scores, and one typeface (Archivo, self-hosted) whose width axis gives condensed titles and normal-width body text. Tokens live in [`src/app/globals.css`](src/app/globals.css).

## Credits

Anime data and artwork from AniList. Yuhengs is not affiliated with AniList or any streaming provider.
