import { getUtcOffsetMinutes } from '@qpqjs/core';

import { ReportQueuedEvent } from '../models/ReportQueuedEvent';
import { ReportStoredEvent } from '../models/ReportStoredEvent';
import { reportBucketKeys } from './reportBucketKeys';

/** The event with its local hour, day and month keys worked out at its own offset, as the log will keep it. */
export const stampReportEvent = (event: ReportQueuedEvent): ReportStoredEvent => ({
  ...event,
  // The offset passed reportQueuedEventProblem, so it always parses; 0 only satisfies the checker.
  bucketKeys: reportBucketKeys(event.at, getUtcOffsetMinutes(event.utcOffset) ?? 0),
});
