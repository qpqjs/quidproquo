import { askConfigGetGlobal, askDateNow, AskResponse, askStorageScopeRead, askThrowError, ErrorTypeEnum, Nullable } from '@qpqjs/core';

import { reportConfigGlobal } from '../constants/reportConfigGlobal';
import { ReportEvent } from '../models/ReportEvent';
import { ReportQueuedEvent } from '../models/ReportQueuedEvent';
import { ReportsConfig } from '../models/ReportsConfig';
import { ReportAppendOptions } from '../types/ReportAppendOptions';
import { askReportEventsSend } from './askReportEventsSend';
import { reportFutureEventProblem } from './reportFutureEventProblem';
import { reportQueuedEventProblem } from './reportQueuedEventProblem';
import { toReportQueuedEvent } from './toReportQueuedEvent';

// The shape first: `at` is only compared with the clock once it is known to be a date-time.
const appendProblem = (event: ReportQueuedEvent, now: string): Nullable<string> =>
  reportQueuedEventProblem(event) ?? reportFutureEventProblem(event.at, now);

/**
 * Appends one event or several to a report, from any service that declares it. Nothing about the events is declared
 * ahead: any type, dimensions and measures inside the shape check are counted. A malformed event, or one dated more than
 * a few minutes ahead, throws Invalid in the caller's story; a failed send is only logged (see askReportEventsSend). Counting happens on the owner, seconds later.
 */
export function* askReportAppend(reportName: string, events: ReportEvent | ReportEvent[], options?: ReportAppendOptions): AskResponse<void> {
  const config = yield* askConfigGetGlobal<ReportsConfig>(reportConfigGlobal(reportName));
  const now = yield* askDateNow();
  const utcOffset = options?.utcOffset ?? config.utcOffset;
  const queued = (Array.isArray(events) ? events : [events]).map((event) => toReportQueuedEvent(event, now, utcOffset));
  const problem = queued.map((event) => appendProblem(event, now)).find((eventProblem) => eventProblem !== null);

  if (problem) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, `askReportAppend('${reportName}'): ${problem}`);
  }

  const scope = yield* askStorageScopeRead();

  yield* askReportEventsSend(reportName, scope, queued);
}
