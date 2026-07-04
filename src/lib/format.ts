const dayFormat = new Intl.DateTimeFormat("en", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Format a YYYY-MM-DD string as e.g. "Sat, Jul 4, 2026" without timezone drift. */
export function formatDay(date: string): string {
  return dayFormat.format(new Date(`${date}T00:00:00`));
}

/** A Date's local-timezone calendar day as YYYY-MM-DD. */
export function toLocalYMD(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's date in the browser's local timezone as YYYY-MM-DD. */
export function localToday(): string {
  return toLocalYMD(new Date());
}
