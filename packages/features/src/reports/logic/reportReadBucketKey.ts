import { getWeekdayFromMonday } from '@qpqjs/core';

import { ReportBucket } from '../models/ReportBucket';
import { addReportDays } from './addReportDays';

/**
 * The bucket a local day falls in, keyed by the bucket's first day as the register keys it: the day itself, its week's
 * Monday, the first of its month, or the first of its quarter's first month. Hours are keyed by their hourly cell key.
 */
export const reportReadBucketKey = (day: string, bucket: Exclude<ReportBucket, ReportBucket.Hour>): string => {
  switch (bucket) {
    case ReportBucket.Day:
      return day;
    case ReportBucket.Week:
      return addReportDays(day, -getWeekdayFromMonday(day));
    case ReportBucket.Month:
      return `${day.slice(0, 7)}-01`;
    case ReportBucket.Quarter:
      return `${day.slice(0, 4)}-${String(Math.floor((Number(day.slice(5, 7)) - 1) / 3) * 3 + 1).padStart(2, '0')}-01`;
  }
};
