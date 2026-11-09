import { getMillisecondsBetween } from '@qpqjs/core';

const DAY_MS = 86_400_000;

/** Calendar days from one `YYYY-MM-DD` to another: 0 for the same day, negative when `to` is earlier. */
export const reportDaysBetween = (from: string, to: string): number => Math.round(getMillisecondsBetween(from, to) / DAY_MS);
