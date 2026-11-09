/**
 * How far an event's `at` may run ahead of the clock that checks it. Further ahead and it would move the month's newest
 * local day forward and trim yesterday's hourly cells early, so it is refused (append) or dropped (consumer).
 */
export const REPORT_EVENT_MAX_AHEAD_MS = 5 * 60_000;
