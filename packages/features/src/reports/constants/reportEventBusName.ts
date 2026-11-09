/** The FIFO bus a report's events are published to; subscribe to it by this name to see the raw events. */
export const reportEventBusName = (reportName: string): string => `${reportName}ReportEvents`;
