import { UtcOffset } from '@qpqjs/core';

/** Options for askReportRead. */
export type ReportReadOptions = {
  // The offset to count at, such as the tenant's; the report's own utcOffset when absent. Use the one events are appended at.
  utcOffset?: UtcOffset;
};
