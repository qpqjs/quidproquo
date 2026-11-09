import { ReportCell } from '../models/ReportCell';
import { ReportReadBucket } from '../models/ReportReadBucket';

/** A view counted over one span: its buckets when it cuts time, its totals, its series over the whole span, and whether it was truncated. */
export type ReportPeriodAnswer = {
  buckets?: ReportReadBucket[];
  total: ReportCell;
  series: Record<string, ReportCell>;
  truncated: boolean;
};
