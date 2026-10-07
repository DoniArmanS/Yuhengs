"use client";

/** Formats a unix timestamp in the viewer's timezone; the server pass renders UTC. */
export function LocalTime({
  timestamp,
  options,
}: {
  timestamp: number;
  options: Intl.DateTimeFormatOptions;
}) {
  const date = new Date(timestamp * 1000);
  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning>
      {date.toLocaleString(undefined, options)}
    </time>
  );
}
