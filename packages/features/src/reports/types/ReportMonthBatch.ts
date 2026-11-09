import { ReportStoredEvent } from '../models/ReportStoredEvent';

/** One queue message's events for one month document, stamped and ready to append. */
export type ReportMonthBatch = {
  docId: string;
  code: string;
  events: ReportStoredEvent[];
};
