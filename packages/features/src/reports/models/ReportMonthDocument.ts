import { Nullable, QpqIsoDateTime } from '@qpqjs/core';

import { EventDocDocument } from '../../eventDoc/models';
import { ReportCells } from './ReportCells';

/** The folded state of one event type's month in one scope: hourly and daily cells, keyed by each event's stamped keys. */
export type ReportMonthDocument = EventDocDocument & {
  // The queue message ids of the last append. Only the last batch can come back (one FIFO group, one batch in flight),
  // so these are all the consumer needs to drop a redelivered message, whether SQS sends back all, some or more of it.
  lastBatchMessageIds: string[];
  // The latest `at` folded and its stamped local day; the hourly trim counts days from these, never from the clock.
  newestAt: Nullable<QpqIsoDateTime>;
  newestDay: Nullable<string>;
  // `YYYY-MM-DDTHH:00`, kept for the newest event's local day and the day before it.
  hourly: Record<string, ReportCells>;
  // `YYYY-MM-DD`, the month's days.
  daily: Record<string, ReportCells>;
  // Every dimension and measure name counted this month, sorted; each list stops at its limit.
  dimensionKeys: string[];
  measureKeys: string[];
  // A name cap refused a dimension or measure name this month, so some counts are in `other` or missing a measure.
  namesCapped: boolean;
};
