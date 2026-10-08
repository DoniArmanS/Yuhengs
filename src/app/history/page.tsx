import type { Metadata } from "next";
import { HistoryList } from "@/components/history-list";

export const metadata: Metadata = {
  title: "History",
  description: "Everything you've watched on this device, newest first.",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-8 sm:px-6 lg:px-10">
      <h1 className="condensed text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold">History</h1>
      <p className="mt-2 text-dim">What you’ve watched on this device, newest first.</p>
      <HistoryList />
    </div>
  );
}
