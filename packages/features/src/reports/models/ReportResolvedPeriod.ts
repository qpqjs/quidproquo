import { QpqIsoDateTime, UtcOffset } from '@qpqjs/core';

import { ReportPeriodRef } from './ReportPeriodRef';

/** A view's period as a read resolved it: the period it named, the offset it was counted at, and its first and last local days. */
export type ReportResolvedPeriod = ReportPeriodRef & {
  utcOffset: UtcOffset;
  // `YYYY-MM-DD`, inclusive.
  from: string;
  to: string;
  // A comparison counted to the same hour as now: the instant counting stopped (exclusive).
  until?: QpqIsoDateTime;
  // A comparison reaching back past the event type's retentionMonths: those months read as nothing.
  beyondRetention?: boolean;
};
