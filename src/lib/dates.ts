/** Formats a Date using its LOCAL calendar fields — never toISOString(),
 * which converts to UTC first and can silently shift the date by a day
 * depending on the browser's timezone offset (e.g. a SAST midnight is
 * still the previous day in UTC). */
export function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * The next `count` dates landing on `dayOfWeek` (0=Sun..6=Sat, matching
 * both JS's Date.getDay() and Postgres's extract(dow from ...) — same
 * convention on both ends), strictly after `from`.
 */
export function nextWeekdays(from: Date, dayOfWeek: number, count: number): string[] {
  const results: string[] = [];
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  while (results.length < count) {
    if (d.getDay() === dayOfWeek) {
      results.push(toISODateLocal(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return results;
}

/** Formats a 'YYYY-MM-DD' string as e.g. "Thu, 15 October" for display. */
export function formatDayMonth(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("en-ZA", { weekday: "short", day: "numeric", month: "long" }).format(date);
}
