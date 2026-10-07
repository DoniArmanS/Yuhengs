import type { NextRequest } from "next/server";
import { latestReadyEpisode } from "@/lib/availability";

/**
 * GET /api/episodes?id=<anilistId>&aired=<n>
 * Highest episode the streaming servers have, for live re-checks from the browser.
 */
export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  const aired = Number(request.nextUrl.searchParams.get("aired"));
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(aired) || aired < 0 || aired > 5000) {
    return Response.json({ error: "id and aired must be positive integers" }, { status: 400 });
  }
  const ready = await latestReadyEpisode(id, aired);
  return Response.json({ ready }, { headers: { "Cache-Control": "no-store" } });
}
