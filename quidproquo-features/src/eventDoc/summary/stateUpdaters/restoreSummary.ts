import { EventDocEventPayload, EventDocSummaryView } from '../../models';

/** Clears the projected `deletedAt`, putting the document back in default listings. */
export const restoreSummary = (model: EventDocSummaryView, _payload: EventDocEventPayload): EventDocSummaryView => {
  const { deletedAt, ...restored } = model;

  return restored;
};
