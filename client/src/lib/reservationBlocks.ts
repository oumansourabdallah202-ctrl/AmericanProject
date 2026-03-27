export type ReservationBlock = {
  id: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  reason?: string | null;
};

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}

export function isTimeInRange(time: string, startTime: string, endTime: string): boolean {
  return time >= startTime && time <= endTime;
}

export function isDateFullyBlockedByRules(date: string, blocks: ReservationBlock[]): boolean {
  return blocks.some((b) => isDateInRange(date, b.start_date, b.end_date) && !b.start_time && !b.end_time);
}

export function isTimeBlockedByRules(date: string, time: string, blocks: ReservationBlock[]): boolean {
  for (const b of blocks) {
    if (!isDateInRange(date, b.start_date, b.end_date)) continue;
    if (!b.start_time || !b.end_time) return true;
    if (isTimeInRange(time, b.start_time, b.end_time)) return true;
  }
  return false;
}
