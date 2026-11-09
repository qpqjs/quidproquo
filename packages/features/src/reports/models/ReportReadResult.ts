import { QpqIsoDateTime } from '@qpqjs/core';

import { ReportBucket } from './ReportBucket';
import { ReportCell } from './ReportCell';
import { ReportComparisonResult } from './ReportComparisonResult';
import { ReportReadBucket } from './ReportReadBucket';
import { ReportReadGroup } from './ReportReadGroup';
import { ReportResolvedPeriod } from './ReportResolvedPeriod';

/**
 * A view answered, in the register query's shape so Kiln's widgets can draw it: `now` (what a line stops at), the
 * resolved period, its buckets when the view cuts time, its totals, its groups when it groups, and its comparison.
 */
export type ReportReadResult = Omit<ReportCell, 'count'> & {
  now: QpqIsoDateTime;
  period: ReportResolvedPeriod;
  bucket?: ReportBucket;
  buckets?: ReportReadBucket[];
  total: number;
  groups?: ReportReadGroup[];
  // How many groups there were before `groupLimit` cut them; absent when nothing was cut.
  groupsTotal?: number;
  comparison?: ReportComparisonResult;
  // An `other` cell or a capped name touched the period, so some counts are not in any series, group or filter.
  truncated: boolean;
  dimensionKeys: string[];
  measureKeys: string[];
};
