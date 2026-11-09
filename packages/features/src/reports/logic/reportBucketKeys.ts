import { QpqIsoDateTime } from '@qpqjs/core';

import { ReportBucketKeys } from '../models/ReportBucketKeys';

/**
 * The local hour, day and month `at` falls in at a fixed offset from UTC (getUtcOffsetMinutes), in the text Kiln's
 * register query keys its buckets by. Plain arithmetic: shift the instant by the offset and read its UTC fields.
 */
export const reportBucketKeys = (at: QpqIsoDateTime, utcOffsetMinutes: number): ReportBucketKeys => {
  const local = new Date(Date.parse(at) + utcOffsetMinutes * 60_000).toISOString();

  return { hour: `${local.slice(0, 13)}:00`, day: local.slice(0, 10), month: local.slice(0, 7) };
};
