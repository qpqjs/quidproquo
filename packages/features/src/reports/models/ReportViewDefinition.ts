import { ReportBucket } from './ReportBucket';
import { ReportCompare } from './ReportCompare';
import { ReportDimensions } from './ReportDimensions';
import { ReportPeriodRef } from './ReportPeriodRef';

/** A read shape over one event type. Nothing in it has to exist before events are appended; it is never stored data. */
export type ReportViewDefinition = {
  event: string;
  period: ReportPeriodRef;
  // Absent: only the whole period's totals and groups, no points over time.
  bucket?: ReportBucket;
  groupBy?: string;
  filter?: ReportDimensions;
  // The measure the view is about; groups rank by its sum.
  measure?: string;
  compare?: ReportCompare;
  groupLimit?: number;
};
