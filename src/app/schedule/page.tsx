import type { Metadata } from "next";
import { getWeekSchedule } from "@/lib/anilist";
import { ScheduleView } from "@/components/schedule-view";

export const metadata: Metadata = {
  title: "Airing schedule",
  description: "New anime episodes airing this week, shown in your local time.",
};

export default async function SchedulePage() {
  const slots = await getWeekSchedule();

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-10 sm:px-6 lg:px-10">
      <h1 className="condensed text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold">Airing schedule</h1>
      <p className="mt-2 text-dim">New episodes this week, in your local time.</p>
      <ScheduleView slots={slots} />
    </div>
  );
}
