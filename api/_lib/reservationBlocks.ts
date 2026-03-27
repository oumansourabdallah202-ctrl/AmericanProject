export type ReservationBlockRow = {
  id: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  is_active: boolean;
  created_at?: string;
};

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}

export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  return time >= startTime && time <= endTime;
}

export function isBlockedByAdminRules(
  date: string,
  time: string,
  blocks: ReservationBlockRow[] | null | undefined
): { blocked: boolean; reason: string | null } {
  if (!Array.isArray(blocks) || blocks.length === 0) return { blocked: false, reason: null };
  for (const b of blocks) {
    if (!b.is_active) continue;
    if (!isDateInRange(date, b.start_date, b.end_date)) continue;
    if (!b.start_time || !b.end_time) {
      return { blocked: true, reason: b.reason ?? null };
    }
    if (isTimeInRange(time, b.start_time, b.end_time)) {
      return { blocked: true, reason: b.reason ?? null };
    }
  }
  return { blocked: false, reason: null };
}
