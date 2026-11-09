import { UtcOffset } from '@qpqjs/core';

/** Options for askReportAppend. */
export type ReportAppendOptions = {
  // The offset these events are counted at, such as the tenant's; the report's own utcOffset when absent.
  utcOffset?: UtcOffset;
};
