import { UtcOffset } from '@qpqjs/core';

import { ReportEventSettings } from './ReportEventSettings';
import { ReportViewDefinition } from './ReportViewDefinition';

/** A report's declaration as every service reads it from the report's config global, defaults resolved. */
export type ReportsConfig = {
  utcOffset: UtcOffset;
  financialYearStartMonth: number;
  scoped: boolean;
  views: Record<string, ReportViewDefinition>;
  events: Record<string, ReportEventSettings>;
};
