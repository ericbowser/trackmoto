/** Anchor day for legacy time-only mile entries (keeps them out of "today"). */
export const LEGACY_MILE_ANCHOR_DATE = new Date(2000, 0, 1);

/** Local calendar day key: YYYY-MM-DD */
export function toLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameLocalDay(isoOrDate: string, day: Date = new Date()): boolean {
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) return false;
  return toLocalDateKey(parsed) === toLocalDateKey(day);
}

/** Try to parse legacy time-only strings like "2:30:45 PM" onto a base day. */
export function parseLegacyTimeOntoDay(timeLabel: string, day: Date = new Date()): Date | null {
  const trimmed = timeLabel.trim();
  // Already an ISO / parseable full datetime
  const direct = new Date(trimmed);
  if (!Number.isNaN(direct.getTime()) && /\d{4}-\d{2}-\d{2}|T/.test(trimmed)) {
    return direct;
  }

  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;
  const meridian = match[4]?.toUpperCase();

  if (meridian === 'PM' && hours < 12) hours += 12;
  if (meridian === 'AM' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59 || seconds > 59) return null;

  const result = new Date(day);
  result.setHours(hours, minutes, seconds, 0);
  return result;
}

export function formatMileEntryWhen(loggedAt: string, now: Date = new Date()): string {
  const parsed = new Date(loggedAt);
  if (Number.isNaN(parsed.getTime())) return loggedAt;

  const time = parsed.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (isSameLocalDay(loggedAt, now)) {
    return `Today · ${time}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameLocalDay(loggedAt, yesterday)) {
    return `Yesterday · ${time}`;
  }

  const date = parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return `${date} · ${time}`;
}

export function formatMileCsvWhen(loggedAt: string): string {
  const parsed = new Date(loggedAt);
  if (Number.isNaN(parsed.getTime())) return loggedAt;
  return parsed.toLocaleString();
}
