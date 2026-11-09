import { ReportCell } from './ReportCell';

/** One groupBy value over a whole period: what a ranked list or a bar reads. */
export type ReportReadGroup = ReportCell & {
  value: string;
};
