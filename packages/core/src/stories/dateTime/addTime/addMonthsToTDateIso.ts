export function addMonthsToTDateIso(startDate: string, numMonths: number): string {
  // Convert ISO string to Date object
  const nowDate = new Date(startDate);

  // Add the months in UTC so the result does not depend on the server's local timezone (DST shifts)
  nowDate.setUTCMonth(nowDate.getUTCMonth() + numMonths);

  // Convert back to ISO string format
  return nowDate.toISOString();
}
