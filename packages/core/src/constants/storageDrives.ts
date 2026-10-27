// NEVER EVER CHANGE THIS NAME.
// If you do, you might get logs generated from the logging service
// writing to the logging service's own log drive — which would be
// recursive and bad. This name is also referenced from Lambda runtime
// code (logger) and cannot be overridden at the config level.
export const QPQ_LOGS_STORAGE_DRIVE_NAME = 'qpq-logs';

// NEVER EVER CHANGE THIS NAME.
// Same rationale as QPQ_LOGS_STORAGE_DRIVE_NAME — the log service's
// report bucket is referenced by resource name from multiple services.
export const QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME = 'qpq-log-reports';
