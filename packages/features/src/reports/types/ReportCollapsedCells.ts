import { ReportCell } from '../models/ReportCell';

/** One hour's or day's cells reduced to a view: the totals that match its filter, one series per groupBy value, and whether an `other` cell was there. */
export type ReportCollapsedCells = {
  total: ReportCell;
  series: Record<string, ReportCell>;
  hasOther: boolean;
};
