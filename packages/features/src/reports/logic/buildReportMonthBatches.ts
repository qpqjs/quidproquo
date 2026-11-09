import { Nullable } from '@qpqjs/core';

import { ReportEventSettings } from '../models/ReportEventSettings';
import { ReportEventsMessage } from '../models/ReportEventsMessage';
import { ReportStoredEvent } from '../models/ReportStoredEvent';
import { ReportMonthBatch } from '../types/ReportMonthBatch';
import { ReportMonthBatches } from '../types/ReportMonthBatches';
import { isReportRecord } from './isReportRecord';
import { keepReportAllowedDimensions } from './keepReportAllowedDimensions';
import { reportMonthCode } from './reportMonthCode';
import { reportMonthDocId } from './reportMonthDocId';
import { reportQueuedEventProblem } from './reportQueuedEventProblem';
import { stampReportEvent } from './stampReportEvent';

// An event of another type than its message would fold into another type's documents.
const eventProblem = (event: unknown, type: string): Nullable<string> =>
  reportQueuedEventProblem(event) ?? (isReportRecord(event) && event.type === type ? null : `an event of another type in a '${type}' message`);

const toMonthBatch = (type: string, month: string, events: ReportStoredEvent[]): ReportMonthBatch => ({
  docId: reportMonthDocId(type, month),
  code: reportMonthCode(type, month),
  events: events.filter((event) => event.bucketKeys.month === month),
});

/**
 * A message's events checked one by one, cut to the type's allowed dimensions, stamped with their local keys and split
 * by month document in month order. Events that fail the check are dropped and counted, never appended.
 */
export const buildReportMonthBatches = (message: ReportEventsMessage, settings?: ReportEventSettings): ReportMonthBatches => {
  const problems = message.events.map((event) => eventProblem(event, message.type));
  const stamped = message.events
    .filter((_, index) => problems[index] === null)
    .map((event) => stampReportEvent(keepReportAllowedDimensions(event, settings?.allowedDimensions)));
  const months = [...new Set(stamped.map((event) => event.bucketKeys.month))].sort();

  return {
    months: months.map((month) => toMonthBatch(message.type, month, stamped)),
    droppedCount: message.events.length - stamped.length,
    dropReason: problems.find((problem) => problem !== null) ?? null,
  };
};
