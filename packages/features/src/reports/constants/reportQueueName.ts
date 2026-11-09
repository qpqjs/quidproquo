/** The owner's FIFO queue that subscribes to a report's bus and folds its events into month documents. */
export const reportQueueName = (reportName: string): string => `${reportName}ReportFold`;
