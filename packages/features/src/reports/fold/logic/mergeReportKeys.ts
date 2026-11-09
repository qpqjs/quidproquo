/** Two key lists as one, without repeats, sorted, so the fold's key lists never depend on the order events arrived in. */
export const mergeReportKeys = (keys: string[], more: string[]): string[] => [...new Set([...keys, ...more])].sort();
