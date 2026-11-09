/** How a view cuts its period into points: hours and days are stored, weeks, months and quarters are added up from days. */
export enum ReportBucket {
  Hour = 'hour',
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
}
