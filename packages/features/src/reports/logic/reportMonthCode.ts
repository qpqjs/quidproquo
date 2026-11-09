import { ReportBucketKeys } from '../models/ReportBucketKeys';

/** The code of the month document an event belongs to: its type and its local month. */
export const reportMonthCode = (type: string, bucketKeys: ReportBucketKeys): string => `${type}/${bucketKeys.month}`;
