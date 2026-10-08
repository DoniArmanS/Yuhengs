import { cacheLife } from "next/cache";

export interface SkipTimes {
  /** Opening, as [start, end] seconds. */
  op: [number, number] | null;
  /** Ending credits, as [start, end] seconds. */
  ed: [number, number] | null;
}

const NONE: SkipTimes = { op: null, ed: null };

/**
 * Opening/ending timestamps from AniSkip (community-submitted, keyed by MAL id).
 * Coverage varies: popular shows usually have them, others may not.
 */
export async function getSkipTimes(malId: number | null, episode: number): Promise<SkipTimes> {
  "use cache";

  if (!malId) {
    cacheLife("max");
    return NONE;
  }
  try {
    const res = await fetch(
      `https://api.aniskip.com/v2/skip-times/${malId}/${episode}?types[]=op&types[]=ed&episodeLength=0`,
      { signal: AbortSignal.timeout(4000) },
    );
    const json = (await res.json()) as {
      found?: boolean;
      results?: { skipType: string; interval: { startTime: number; endTime: number } }[];
    };
    const pick = (type: string): [number, number] | null => {
      const r = json.results?.find((x) => x.skipType === type);
      return r && r.interval.endTime > r.interval.startTime ? [r.interval.startTime, r.interval.endTime] : null;
    };
    // Found or confirmed missing: both are stable answers. Recheck daily for new submissions.
    cacheLife("days");
    return json.found ? { op: pick("op"), ed: pick("ed") } : NONE;
  } catch {
    // AniSkip unreachable: try again in a little while.
    cacheLife("hours");
    return NONE;
  }
}
