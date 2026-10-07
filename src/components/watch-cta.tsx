"use client";

import Link from "next/link";
import { useLastEpisode } from "@/lib/history";
import { PlayIcon } from "./icons";

export function WatchCta({ animeId, available }: { animeId: number; available: number }) {
  const last = useLastEpisode(animeId);
  const resume = last && last <= available ? last : null;

  return (
    <Link
      href={`/watch/${animeId}/${resume ?? 1}`}
      className="rounded-[3px] transition-colors inline-flex h-12 items-center gap-2.5 px-6 font-semibold text-white bg-onair hover:bg-onair-hover"
    >
      <PlayIcon className="size-4" />
      {resume ? `Continue episode ${resume}` : "Watch episode 1"}
    </Link>
  );
}
