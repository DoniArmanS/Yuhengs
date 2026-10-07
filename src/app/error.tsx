"use client";

import { EmptyState } from "@/components/empty-state";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const rateLimited = error.message.includes("rate limiting");

  return (
    <EmptyState title={rateLimited ? "Too many requests right now" : "This page failed to load"}>
      <p>
        {rateLimited
          ? "AniList, where our anime data comes from, is limiting requests. Wait a minute, then try again."
          : "Something went wrong while loading anime data. Try again, and if it keeps failing, come back later."}
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-[3px] transition-[background-color,transform] duration-150 active:scale-[0.97] mt-6 inline-flex h-11 items-center px-5 font-semibold text-white bg-onair"
      >
        Try again
      </button>
    </EmptyState>
  );
}
