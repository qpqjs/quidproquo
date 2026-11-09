import { getMillisecondsBetween, Nullable } from '@qpqjs/core';

import { REPORT_EVENT_MAX_AHEAD_MS } from '../constants/reportEventMaxAheadMs';

/** Why an event dated `at` is too far ahead of `now` to count, or null when it is not. Both are ISO date-times, `now` the caller's clock. */
export const reportFutureEventProblem = (at: string, now: string): Nullable<string> =>
  getMillisecondsBetween(now, at) > REPORT_EVENT_MAX_AHEAD_MS
    ? `at ${at} is more than ${REPORT_EVENT_MAX_AHEAD_MS / 60_000} minutes after now (${now})`
    : null;
