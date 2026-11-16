import { EventDocEventPayload, EventDocInitData, EventDocSummaryView } from '../../models';

/** Records who created the document and opens its v1 version entry at INIT. The base reducer has already set the identity. */
export const initSummary = (model: EventDocSummaryView, { metadata }: EventDocEventPayload<EventDocInitData>): EventDocSummaryView => ({
  ...model,
  createdBy: metadata.createdBy.userId,
  versions: [{ version: 1, eventId: metadata.eventId }],
});
