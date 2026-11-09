import { ReportCell } from './ReportCell';
import { ReportCompare } from './ReportCompare';
import { ReportReadBucket } from './ReportReadBucket';
import { ReportReadGroup } from './ReportReadGroup';
import { ReportResolvedPeriod } from './ReportResolvedPeriod';

/**
 * The same view over the earlier period `compare` names, counted to the same point when the period is in progress. Its
 * groups line up with the answer's (the answer's values in its order); its buckets are the earlier period's own, in order.
 */
export type ReportComparisonResult = Omit<ReportCell, 'count'> & {
  compare: ReportCompare;
  period: ReportResolvedPeriod;
  total: number;
  buckets?: ReportReadBucket[];
  groups?: ReportReadGroup[];
};
