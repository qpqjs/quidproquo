import { Nullable } from '@qpqjs/core';

import { ReportMonthBatch } from './ReportMonthBatch';

/** A message's events split by month document, with what was dropped and the first reason why. */
export type ReportMonthBatches = {
  months: ReportMonthBatch[];
  droppedCount: number;
  dropReason: Nullable<string>;
};
