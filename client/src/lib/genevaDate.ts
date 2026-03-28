/** Spinella calendar and clock in Europe/Zurich (Geneva). */

const GENEVA_TZ = "Europe/Zurich";

/** YYYY-MM-DD for the given instant in Geneva. */
export function getGenevaDateISO(now: Date = new Date()): string {
  return now.toLocaleDateString("sv-SE", { timeZone: GENEVA_TZ });
}

/** Minutes since midnight (0–1439) in Geneva for the given instant. */
export function getGenevaTimeMinutes(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: GENEVA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return h * 60 + m;
}
