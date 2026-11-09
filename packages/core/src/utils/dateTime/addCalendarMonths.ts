/**
 * The calendar day (`YYYY-MM-DD`) some whole months after `day` (negative for before), the day of the month kept where the
 * target month has it and clamped to its last day where not: 31 March less a month is 28 or 29 February. Unlike
 * addMonthsToTDateIso, which lets a short month overflow into the next (31 March less a month is 3 March).
 */
export const addCalendarMonths = (day: string, months: number): string => {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  const index = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(index / 12);
  const targetMonth = index - targetYear * 12 + 1;
  // Day 0 of the month after is the last day of this one.
  const lastDate = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const pad = (value: number): string => String(value).padStart(2, '0');

  return `${String(targetYear).padStart(4, '0')}-${pad(targetMonth)}-${pad(Math.min(date, lastDate))}`;
};
