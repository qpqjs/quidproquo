import { QpqIsoDateTime, UtcOffset } from '@qpqjs/core';

import { ReportDimensions } from './ReportDimensions';
import { ReportMeasures } from './ReportMeasures';

/** A report event as it crosses the bus: `at` and the offset it is counted at are stamped by the append; keys are not yet. */
export type ReportQueuedEvent = {
  type: string;
  at: QpqIsoDateTime;
  utcOffset: UtcOffset;
  dimensions: ReportDimensions;
  measures: ReportMeasures;
};
