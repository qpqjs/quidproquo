import { Nullable } from '@qpqjs/core';

import { ReportSpan } from './ReportSpan';

/** What a read will count and which month documents it must read: the period, the comparison's, and the months for each. */
export type ReportReadPlan = {
  period: ReportSpan;
  periodMonths: string[];
  comparison: Nullable<{ span: ReportSpan; months: string[]; beyondRetention: boolean }>;
};
