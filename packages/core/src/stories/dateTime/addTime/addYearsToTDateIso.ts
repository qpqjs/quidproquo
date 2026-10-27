export function addYearsToTDateIso(startDate: string, numYears: number): string {
  // Convert ISO string to Date object
  const nowDate = new Date(startDate);

  // Add the years in UTC so the result does not depend on the server's local timezone (DST shifts)
  nowDate.setUTCFullYear(nowDate.getUTCFullYear() + numYears);

  // Convert back to ISO string format
  return nowDate.toISOString();
}
