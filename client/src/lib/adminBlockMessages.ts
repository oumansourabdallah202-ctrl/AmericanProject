/**
 * Admin presets store English copy; map to i18n keys for the public booking page.
 */
const PRESET_REASON_TO_KEY: Record<string, string> = {
  "Sorry, we can't take more reservations for today.": "booking.dateUnavailableToday",
  "Sorry, we can't take more reservations for this period.": "booking.adminBlockReasonPeriod",
};

export function localizedAdminBlockReason(
  reason: string | null | undefined,
  t: (key: string) => string
): string {
  const r = reason?.trim();
  if (r && PRESET_REASON_TO_KEY[r]) {
    return t(PRESET_REASON_TO_KEY[r]);
  }
  if (r) return r;
  return t("booking.adminFullDayBlocked");
}
