export function addDayMonthYearToTDateIso(startDate: string, numDays: number, numMonths: number, numYears: number): string {
  // Convert ISO string to Date object
  const nowDate = new Date(startDate);

  // Apply the offsets in UTC so the result does not depend on the server's local timezone (DST shifts)
  nowDate.setUTCDate(nowDate.getUTCDate() + numDays);
  nowDate.setUTCMonth(nowDate.getUTCMonth() + numMonths);
  nowDate.setUTCFullYear(nowDate.getUTCFullYear() + numYears);

  // Convert back to ISO string format
  return nowDate.toISOString();
}
