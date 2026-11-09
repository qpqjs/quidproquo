import { ReportMonthDocument } from '../../models/ReportMonthDocument';
import { ReportMonthLimits } from '../../models/ReportMonthLimits';
import { ReportStoredEvent } from '../../models/ReportStoredEvent';
import { applyReportEvent } from './applyReportEvent';
import { trimReportHourly } from './trimReportHourly';

/** The document with a batch of events counted in log order under the batch's limits, then its hourly cells trimmed. Pure. */
export const applyReportEvents = (state: ReportMonthDocument, events: ReportStoredEvent[], limits: ReportMonthLimits): ReportMonthDocument =>
  trimReportHourly(events.reduce((current, event) => applyReportEvent(current, event, limits), state));
