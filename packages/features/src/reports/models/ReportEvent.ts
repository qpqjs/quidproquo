import { QpqIsoDateTime } from '@qpqjs/core';

import { ReportDimensions } from './ReportDimensions';
import { ReportMeasures } from './ReportMeasures';

/** One thing that happened, as an app appends it to a report. `at` defaults to the appending story's clock. */
export type ReportEvent = {
  type: string;
  at?: QpqIsoDateTime;
  dimensions: ReportDimensions;
  measures?: ReportMeasures;
};
