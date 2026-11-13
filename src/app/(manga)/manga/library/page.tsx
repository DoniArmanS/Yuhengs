import type { Metadata } from "next";
import { Library } from "@/components/manga/library";

export const metadata: Metadata = {
  title: "Library",
};

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-10 sm:px-6 lg:px-10">
      <h1 className="condensed text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold">Library</h1>
      <p className="mt-2 text-sm text-dim">Everything you’ve started, newest first. Saved in this browser only.</p>
      <Library />
    </div>
  );
}
