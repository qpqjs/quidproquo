import { ReportMonthLimits } from './ReportMonthLimits';
import { ReportStoredEvent } from './ReportStoredEvent';

/** One queue batch's events for one month document, appended as one log event. Its limits travel with it so the fold reads no config. */
export type ReportMonthAppendEventsData = {
  // The ids of the queue messages whose events this append holds; the consumer drops any of them SQS delivers again.
  messageIds: string[];
  limits: ReportMonthLimits;
  events: ReportStoredEvent[];
};
