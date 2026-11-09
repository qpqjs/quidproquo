/** The weekday of a calendar day (`YYYY-MM-DD`), 0 for Monday to 6 for Sunday. A civil date's weekday needs no zone. */
export const getWeekdayFromMonday = (day: string): number => (new Date(`${day}T00:00:00.000Z`).getUTCDay() + 6) % 7;
