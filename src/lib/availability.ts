import { cacheLife } from "next/cache";
import { cache } from "react";
import type { AiringSlot } from "./types";
import { slotKey } from "./format";

/**
 * Episode availability: AniList says when an episode *aired*, but streaming
 * servers upload it minutes to hours later (and some shows never get
 * uploaded). These checks ask the servers directly so the site only offers
 * episodes that will actually play.
 *
 * Two servers expose a reliable signal in their embed HTML:
 *  - AniEmbed renders its page data inline: `servers:{...}` when the episode
 *    exists, `error:"API responded with 404"` when it doesn't.
 *  - MegaPlay titles the page "File <n> - MegaPlay" vs "Error - MegaPlay".
 * A server that times out or is blocked reports `null` (unknown).
 *
 * Providers may also answer "not found" to requests from hosting data
 * centres (Vercel's default region is in the US) while working fine for
 * viewers. Canary checks below detect that and switch the provider's answers
 * to "unknown", so the site falls back to showing every aired episode.
 */

export interface EpisodeCheck {
  aniembed: boolean | null;
  megaplay: boolean | null;
}

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(4000) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

async function probeAniEmbed(id: number, ep: number): Promise<boolean | null> {
  const html = await fetchText(`https://aniembed.se/e/${id}/${ep}?lang=sub`);
  if (!html) return null;
  if (/servers:\{/.test(html) && /error:null/.test(html)) return true;
  if (/servers:null/.test(html) || /error:"[^"]+"/.test(html)) return false;
  return null;
}

async function probeMegaPlay(id: number, ep: number): Promise<boolean | null> {
  const html = await fetchText(`https://megaplay.buzz/stream/ani/${id}/${ep}/sub`);
  if (!html) return null;
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  if (/^File \d+/.test(title)) return true;
  if (/^Error/.test(title)) return false;
  return null;
}

/**
 * Episodes every provider certainly has. If a provider says "no" to these,
 * it's refusing *us* (e.g. blocking our hosting region), not missing the show,
 * so its answers can't be trusted from this server.
 */
const CANARIES = [
  { id: 154587, ep: 1 }, // Frieren
  { id: 21, ep: 1 }, // One Piece
];

type Provider = "aniembed" | "megaplay";
const PROBES: Record<Provider, (id: number, ep: number) => Promise<boolean | null>> = {
  aniembed: probeAniEmbed,
  megaplay: probeMegaPlay,
};

/** Whether a provider gives this server truthful answers, judged by the canary episodes. */
async function providerAnswers(provider: Provider): Promise<boolean> {
  "use cache";

  const results = await Promise.all(CANARIES.map((c) => PROBES[provider](c.id, c.ep)));
  const ok = results.some((r) => r === true);
  // Re-test a blocked provider every few minutes; a healthy one hourly.
  if (ok) cacheLife("hours");
  else cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  return ok;
}

/** Which servers have this episode. Ready answers are kept for days, misses only for minutes. */
export async function checkEpisode(id: number, ep: number): Promise<EpisodeCheck> {
  "use cache";

  // A provider that fails its canary reports "unknown" rather than a false "no".
  const [aeTrusted, mpTrusted] = await Promise.all([providerAnswers("aniembed"), providerAnswers("megaplay")]);
  const [aniembed, megaplay] = await Promise.all([
    aeTrusted ? probeAniEmbed(id, ep) : null,
    mpTrusted ? probeMegaPlay(id, ep) : null,
  ]);
  const result = { aniembed, megaplay };

  if (isReady(result)) {
    cacheLife("days");
  } else {
    // Re-ask every 5 minutes (in the background): a just-aired episode usually lands
    // within the hour. `stale` stays at 5 minutes so pages using this remain
    // prerenderable; anything shorter drops them out of the instant App Shell.
    cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  }
  return result;
}

/** Ready if any server has it. If no server answered at all, don't hide it (fail open). */
export function isReady(check: EpisodeCheck): boolean {
  if (check.aniembed === true || check.megaplay === true) return true;
  return check.aniembed === null && check.megaplay === null;
}

async function ready(id: number, ep: number) {
  return isReady(await checkEpisode(id, ep));
}

/**
 * Highest episode number (1..aired) that the servers actually have. Checks the
 * newest first, since that's almost always the answer, then binary-searches,
 * so a 40-episode show costs about six checks instead of forty.
 */
export const latestReadyEpisode = cache(async function latestReadyEpisode(id: number, aired: number): Promise<number> {
  "use cache";
  // Cached as a whole, so a page gets the answer at once and re-checks run in the background.
  cacheLife("minutes");

  if (aired <= 0) return 0;
  if (await ready(id, aired)) return aired;
  if (aired === 1) return 0;
  if (await ready(id, aired - 1)) return aired - 1;
  if (!(await ready(id, 1))) return 0;

  let lo = 1; // known ready
  let hi = aired - 1; // known not ready
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (await ready(id, mid)) lo = mid;
    else hi = mid;
  }
  return lo;
});

/**
 * Of the episodes that have aired, which are on the servers. Checks at most
 * `limit` of the most recent ones, a few at a time, so the servers aren't flooded.
 */
export async function readySlotKeys(slots: AiringSlot[], now: number, limit = 24): Promise<string[]> {
  const aired = slots
    .filter((s) => s.airingAt <= now)
    .sort((a, b) => b.airingAt - a.airingAt)
    .slice(0, limit);

  const keys: string[] = [];
  const queue = [...aired];
  const worker = async () => {
    for (let slot = queue.shift(); slot; slot = queue.shift()) {
      if (await ready(slot.media.id, slot.episode)) keys.push(slotKey(slot));
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  return keys;
}

/** Raw provider responses for one episode, for troubleshooting a deployment (uncached). */
export async function diagnose(id: number, ep: number) {
  const one = async (url: string) => {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(4000) });
      const html = await res.text();
      return {
        status: res.status,
        title: html.match(/<title>([^<]*)<\/title>/)?.[1] ?? null,
        error: html.match(/error:("[^"]*"|null)/)?.[1] ?? null,
        bytes: html.length,
      };
    } catch (e) {
      return { failed: String(e) };
    }
  };
  const [aniembed, megaplay] = await Promise.all([
    one(`https://aniembed.se/e/${id}/${ep}?lang=sub`),
    one(`https://megaplay.buzz/stream/ani/${id}/${ep}/sub`),
  ]);
  return {
    region: process.env.VERCEL_REGION ?? "local",
    aniembed,
    megaplay,
    trusted: { aniembed: await providerAnswers("aniembed"), megaplay: await providerAnswers("megaplay") },
  };
}
