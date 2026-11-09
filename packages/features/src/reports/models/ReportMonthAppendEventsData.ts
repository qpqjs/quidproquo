import { ReportMonthLimits } from './ReportMonthLimits';
import { ReportStoredEvent } from './ReportStoredEvent';

/**
 * One queue message's events for one month document, appended as one log event whose clientMessageId is the message's
 * id, so a redelivered message is refused by the fold's dedup window. Its limits travel with it so the fold reads no config.
 */
export type ReportMonthAppendEventsData = {
  limits: ReportMonthLimits;
  events: ReportStoredEvent[];
};
