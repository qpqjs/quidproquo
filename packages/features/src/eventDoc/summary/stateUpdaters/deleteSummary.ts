import { EventDocEventPayload, EventDocSummaryView } from '../../models';

/** Projects DELETE onto `deletedAt`, which askEventDocList filters on by default. */
export const deleteSummary = (model: EventDocSummaryView, { metadata }: EventDocEventPayload): EventDocSummaryView => ({
  ...model,
  deletedAt: metadata.createdAt,
});
