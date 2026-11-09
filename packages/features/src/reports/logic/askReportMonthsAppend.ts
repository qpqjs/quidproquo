import { AskResponse } from '@qpqjs/core';

import { ReportMonthLimits } from '../models/ReportMonthLimits';
import { ReportMonthBatch } from '../types/ReportMonthBatch';
import { askReportMonthAppend } from './askReportMonthAppend';

/** Appends a message's month batches in month order, one document after another. Assumes the store context and the scope. */
export function* askReportMonthsAppend(months: ReportMonthBatch[], messageId: string, limits: ReportMonthLimits): AskResponse<void> {
  for (const month of months) {
    yield* askReportMonthAppend(month, messageId, limits);
  }
}
