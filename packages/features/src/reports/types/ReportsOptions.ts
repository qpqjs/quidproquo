import { CrossModuleOwnerWithNoResourceOverride, UtcOffset } from '@qpqjs/core';

import { ReportEventSettings } from '../models/ReportEventSettings';
import { ReportViewDefinition } from '../models/ReportViewDefinition';

/** Options for defineReports. Pass the same options in every service; the owner field alone decides what materialises where. */
export type ReportsOptions = {
  // The service whose deploy creates the stores and the bus; every other service gets references. `module` is required.
  owner: CrossModuleOwnerWithNoResourceOverride & { module: string };
  // The fixed offset hours, days and months are counted in, as `±HH:MM`. It never follows daylight saving. Defaults to +00:00.
  utcOffset?: UtcOffset;
  // 1 to 12. Defaults to 7 (July).
  financialYearStartMonth?: number;
  views?: Record<string, ReportViewDefinition>;
  events?: Record<string, ReportEventSettings>;
  // Month documents partition by the scope each event was appended under.
  scoped?: boolean;
};
