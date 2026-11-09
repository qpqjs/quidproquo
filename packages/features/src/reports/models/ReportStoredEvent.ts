import { QpqIsoDateTime, UtcOffset } from '@qpqjs/core';

import { ReportBucketKeys } from './ReportBucketKeys';
import { ReportDimensions } from './ReportDimensions';
import { ReportMeasures } from './ReportMeasures';

/**
 * A report event as the log keeps it. `at`, the offset it was counted in and its local bucket keys are stamped before it
 * is stored, so the fold only reads keys and a refold always puts an event back where it was first counted.
 */
export type ReportStoredEvent = {
  type: string;
  at: QpqIsoDateTime;
  utcOffset: UtcOffset;
  bucketKeys: ReportBucketKeys;
  dimensions: ReportDimensions;
  measures: ReportMeasures;
};
