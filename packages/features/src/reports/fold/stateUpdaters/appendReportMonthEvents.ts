import { EventDocEventPayload } from '../../../eventDoc/models';
import { ReportMonthAppendEventsData } from '../../models/ReportMonthAppendEventsData';
import { ReportMonthDocument } from '../../models/ReportMonthDocument';
import { applyReportEvents } from '../logic/applyReportEvents';

/** Folds one APPEND_EVENTS log event: one queue message's events for this month. */
export const appendReportMonthEvents = (
  state: ReportMonthDocument,
  payload: EventDocEventPayload<ReportMonthAppendEventsData>,
): ReportMonthDocument => applyReportEvents(state, payload.data.events, payload.data.limits);
