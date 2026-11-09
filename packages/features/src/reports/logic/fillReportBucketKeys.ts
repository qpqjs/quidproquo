import { ReportBucket } from '../models/ReportBucket';
import { ReportSpan } from '../types/ReportSpan';
import { reportReadBucketKey } from './reportReadBucketKey';
import { reportSpanDays } from './reportSpanDays';
import { reportSpanHours } from './reportSpanHours';

/**
 * Every bucket key of a span, in time order, so a line has no holes: buckets with nothing in them are drawn at 0, and so
 * are buckets still to come. A week, month or quarter at either end holds only the span's own days.
 */
export const fillReportBucketKeys = (span: ReportSpan, bucket: ReportBucket): string[] =>
  bucket === ReportBucket.Hour ? reportSpanHours(span) : [...new Set(reportSpanDays(span).map((day) => reportReadBucketKey(day, bucket)))];
