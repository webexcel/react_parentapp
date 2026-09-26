/**
 * Date-only parsing that does not shift across timezones.
 *
 * The API returns MySQL DATE columns as bare 'YYYY-MM-DD' strings
 * (Mob_Teacher_node/configs/db.js sets `dateStrings: ['DATE']`). Those are
 * CALENDAR dates — a homework due date, a leave date, an attendance day. They
 * have no time and no timezone, and must render identically on every device.
 *
 * `new Date('2026-09-04')` does NOT do that: the ECMAScript spec parses the
 * date-only form as UTC midnight. Reading a local component off it then shifts
 * the day on any device at a negative UTC offset:
 *
 *   new Date('2026-09-04').getDate()
 *     device on Asia/Kolkata  -> 4   (00:00Z is 05:30 the same day)
 *     device on UTC           -> 4
 *     device on New_York (-5) -> 3   WRONG DAY
 *
 * That is the client half of the same bug the backend `dateStrings` fix
 * addressed: it is why a calendar looked right on one phone and a day out on
 * another whose timezone had drifted (auto-time off, restored backup, a fresh
 * setup that never synced).
 *
 * `parseLocalDate` builds the date from its parts instead, so it always lands
 * on local midnight of the intended day, whatever the device is set to.
 */

/** Matches a bare calendar date, optionally followed by a time we ignore. */
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/;

/**
 * Parse an API date into a Date anchored at LOCAL midnight of that calendar day.
 *
 * - 'YYYY-MM-DD'                  → local midnight of that day (timezone-proof)
 * - 'YYYY-MM-DDTHH:mm:ss(Z)'      → the date part only, at local midnight.
 *   Legacy rows and any not-yet-updated endpoint still send this shape; taking
 *   the leading date keeps behaviour stable while those exist. Do NOT use this
 *   for true timestamps (created_at, updateTme) where the time matters — parse
 *   those with `new Date()` as an instant.
 * - anything else                 → falls back to `new Date(value)`
 *
 * Returns null for empty/unparseable input so callers can branch instead of
 * rendering "Invalid Date".
 */
export const parseLocalDate = (value?: string | number | Date | null): Date | null => {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === 'string') {
    const m = DATE_ONLY.exec(value.trim());
    if (m) {
      const [, y, mo, d] = m;
      // Month is 0-based. This constructor is local-time, which is the point.
      const dt = new Date(Number(y), Number(mo) - 1, Number(d));
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
  }

  const fallback = new Date(value as any);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Whole days from today to `value`, both taken at local midnight so the result
 * is a calendar-day difference and never a rounding of partial hours.
 * Negative = in the past. Returns null when the date cannot be parsed.
 */
export const daysFromToday = (value?: string | number | Date | null): number | null => {
  const target = parseLocalDate(value);
  if (!target) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  // Both operands are local midnight, so the quotient is already a whole
  // number of days except across a DST change — round to absorb that.
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
};

/** Sort key for a calendar date. Unparseable values sort last. */
export const dateSortValue = (value?: string | number | Date | null): number => {
  const d = parseLocalDate(value);
  return d ? d.getTime() : Number.POSITIVE_INFINITY;
};
