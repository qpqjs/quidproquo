import { EventDocEventPayload } from '../../../eventDoc/models';
import { ReportMonthAppendEventsData } from '../../models/ReportMonthAppendEventsData';
import { ReportMonthDocument } from '../../models/ReportMonthDocument';
import { applyReportEvents } from '../logic/applyReportEvents';

/** Folds one APPEND_EVENTS batch, recording its message ids so the consumer can drop any message SQS delivers again. */
export const appendReportMonthEvents = (
  state: ReportMonthDocument,
  payload: EventDocEventPayload<ReportMonthAppendEventsData>,
): ReportMonthDocument => ({
  ...applyReportEvents(state, payload.data.events, payload.data.limits),
  lastBatchMessageIds: payload.data.messageIds,
});
