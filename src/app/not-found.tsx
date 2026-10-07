import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <EmptyState title="This page doesn’t exist">
      <p>The link may be broken, or the anime was removed from AniList.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-[3px] transition-[background-color,transform] duration-150 active:scale-[0.97] inline-flex h-11 items-center px-5 font-semibold text-white bg-onair"
        >
          Go home
        </Link>
        <Link href="/search" className="inline-flex h-11 items-center rounded-[2px] border border-rule px-5 font-semibold text-paper hover:border-paper/50">
          Browse anime
        </Link>
      </div>
    </EmptyState>
  );
}
