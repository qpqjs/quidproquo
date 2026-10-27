import { EventDocEventPayload, EventDocSetCodeData, EventDocSummaryView } from '../../models';

/** Sets the summary code. */
export const setSummaryCode = (model: EventDocSummaryView, { data }: EventDocEventPayload<EventDocSetCodeData>): EventDocSummaryView => ({
  ...model,
  code: data.code,
});
