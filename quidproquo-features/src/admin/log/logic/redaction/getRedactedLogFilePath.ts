/** Key of the cached redacted copy of a log on the reports drive. */
export const getRedactedLogFilePath = (correlation: string): string => `${correlation}.redacted.json`;
