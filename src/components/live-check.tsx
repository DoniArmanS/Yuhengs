"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTERVAL = 3 * 60 * 1000;

/**
 * Shown while aired episodes are still uploading. Re-asks the server every few
 * minutes (only while the tab is visible) and refreshes the page as soon as a
 * new episode is ready, so it appears without a manual reload.
 */
export function LiveCheck({ animeId, aired, ready }: { animeId: number; aired: number; ready: number }) {
  const router = useRouter();
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    async function check() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/episodes?id=${animeId}&aired=${aired}`, { cache: "no-store" });
        const data = (await res.json()) as { ready?: number };
        if (stopped) return;
        setCheckedAt(new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }));
        if ((data.ready ?? 0) > ready) router.refresh();
      } catch {
        // Offline or server busy; try again next interval.
      }
    }
    const timer = setInterval(check, INTERVAL);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [animeId, aired, ready, router]);

  const pending = aired - ready;
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[3px] border border-rule bg-panel px-4 py-3 text-sm text-dim" role="status">
      <span className="tuning size-2 shrink-0 rounded-full bg-guide" aria-hidden />
      <span className="text-paper">
        {ready === 0
          ? `${aired === 1 ? "Episode 1 has" : `${aired} episodes have`} aired but aren’t on our servers yet.`
          : pending === 1
            ? `Episode ${aired} has aired and is still uploading.`
            : `Episodes ${ready + 1}–${aired} have aired and are still uploading.`}
      </span>
      <span>
        New episodes show up here on their own once they’re ready{checkedAt ? ` (last checked ${checkedAt})` : ""}.
      </span>
    </p>
  );
}
