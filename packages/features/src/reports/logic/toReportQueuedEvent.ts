import { QpqIsoDateTime, UtcOffset } from '@qpqjs/core';

import { ReportEvent } from '../models/ReportEvent';
import { ReportQueuedEvent } from '../models/ReportQueuedEvent';

/** An appended event as it will cross the bus: `at` defaulted to now, the offset stamped, measures defaulted to none. */
export const toReportQueuedEvent = (event: ReportEvent, now: QpqIsoDateTime, utcOffset: UtcOffset): ReportQueuedEvent => ({
  type: event.type,
  at: event.at ?? now,
  utcOffset,
  dimensions: event.dimensions,
  measures: event.measures ?? {},
});
