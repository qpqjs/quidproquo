/**
 * A day of the week, numbered the way JavaScript numbers them
 * (`Date.getUTCDay()`), because the canonical schedule fields are matched
 * against a real clock in the dev server.
 *
 * AWS numbers day-of-week 1-7 for SUN-SAT, so the cron renderer adds one. That
 * offset lives in the renderer, which is the only place that should know
 * anything about the AWS dialect.
 */
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}
