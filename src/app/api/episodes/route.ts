import type { NextRequest } from "next/server";
import { diagnose, latestReadyEpisode } from "@/lib/availability";

/**
 * GET /api/episodes?id=<anilistId>&aired=<n>
 * Highest episode the streaming servers have, for live re-checks from the browser.
 * Add &debug=1 to see the raw provider responses this server gets.
 */
export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get("id"));
  const aired = Number(request.nextUrl.searchParams.get("aired"));
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(aired) || aired < 0 || aired > 5000) {
    return Response.json({ error: "id and aired must be positive integers" }, { status: 400 });
  }
  if (request.nextUrl.searchParams.get("debug") === "1") {
    return Response.json(await diagnose(id, Math.max(aired, 1)), { headers: { "Cache-Control": "no-store" } });
  }
  const ready = await latestReadyEpisode(id, aired);
  return Response.json({ ready }, { headers: { "Cache-Control": "no-store" } });
}
