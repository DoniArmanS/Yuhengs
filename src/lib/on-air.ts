import { cacheLife } from "next/cache";
import { cache } from "react";
import { getBlurbs, getBroadcast, getWeekSchedule } from "./anilist";
import { readySlotKeys } from "./availability";
import { displayTitle, plainDescription, slotKey } from "./format";
import type { AiringSlot } from "./types";
import type { SpotlightSlide } from "@/components/spotlight";

/**
 * Everything the home page's live sections need, computed as one cached unit:
 * the airing feed, which aired episodes the servers actually have, and the
 * spotlight picks with synopses. The explicit lifetime wraps the slower
 * server checks inside, so visitors get the cached result and refreshes run
 * in the background instead of blocking a navigation.
 */
export const getOnAirData = cache(async function getOnAirData() {
  "use cache";
  cacheLife("minutes");

  const { slots, fetchedAt } = await getBroadcast();
  const readyKeys = await readySlotKeys(slots, fetchedAt);
  const ready = new Set(readyKeys);

  const seen = new Set<number>();
  const latestPerShow = slots
    .filter((s) => s.airingAt <= fetchedAt && ready.has(slotKey(s)))
    .sort((a, b) => b.airingAt - a.airingAt)
    .filter((s) => (seen.has(s.media.id) ? false : (seen.add(s.media.id), true)));

  const lastDay = latestPerShow.filter((s) => s.airingAt >= fetchedAt - 86_400);
  const picks = [...(lastDay.length ? lastDay : latestPerShow)]
    .sort(
      (a, b) =>
        Number(Boolean(b.media.bannerImage)) - Number(Boolean(a.media.bannerImage)) ||
        (b.media.popularity ?? 0) - (a.media.popularity ?? 0),
    )
    .slice(0, 5);
  const blurbs = await getBlurbs(picks.map((s) => s.media.id));

  const slides: SpotlightSlide[] = picks.map((s) => ({
    id: s.media.id,
    title: displayTitle(s.media),
    episode: s.episode,
    airingAt: s.airingAt,
    art: s.media.bannerImage ?? blurbs[s.media.id]?.bannerImage ?? s.media.coverImage.extraLarge,
    cover: s.media.coverImage.extraLarge ?? s.media.coverImage.large,
    color: s.media.coverImage.color,
    genres: s.media.genres,
    blurb: plainDescription(blurbs[s.media.id]?.description ?? null).split("\n")[0].slice(0, 260),
  }));

  return {
    slots,
    readyKeys,
    slides,
    justAired: latestPerShow.slice(0, 7),
    justIn: latestPerShow.slice(0, 12),
  };
});

/** The week schedule plus which aired episodes are playable, cached together. */
export async function getScheduleData(): Promise<{ slots: AiringSlot[]; readyKeys: string[] }> {
  "use cache";
  cacheLife("minutes");

  const { slots, fetchedAt } = await getWeekSchedule();
  const readyKeys = await readySlotKeys(slots, fetchedAt, 40);
  return { slots, readyKeys };
}
