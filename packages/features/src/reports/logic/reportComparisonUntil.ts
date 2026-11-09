import { getQpqIsoDateTimeFromDate, QpqIsoDateTime } from '@qpqjs/core';

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

/** The instant a comparison cut at a local hour stops counting (exclusive): the end of `lastHour` on `day`, at the offset. */
export const reportComparisonUntil = (day: string, lastHour: number, utcOffsetMinutes: number): QpqIsoDateTime =>
  getQpqIsoDateTimeFromDate(new Date(Date.parse(`${day}T00:00:00.000Z`) + (lastHour + 1) * HOUR_MS - utcOffsetMinutes * MINUTE_MS));
