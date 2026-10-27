import { EventDocEventPayload, EventDocSetNameData, EventDocSummaryView } from '../../models';

/** Sets the summary name. */
export const setSummaryName = (model: EventDocSummaryView, { data }: EventDocEventPayload<EventDocSetNameData>): EventDocSummaryView => ({
  ...model,
  name: data.name,
});
