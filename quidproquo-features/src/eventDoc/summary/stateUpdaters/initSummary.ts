import { EventDocEventPayload, EventDocInitData, EventDocSummaryView } from '../../models';

/** Builds the identity and the v1 version entry from INIT. updatedAt/updatedBy are stamped by the applier. */
export const initSummary = (model: EventDocSummaryView, { data, metadata }: EventDocEventPayload<EventDocInitData>): EventDocSummaryView => ({
  ...model,
  id: data.id,
  code: data.code,
  name: data.name,
  createdAt: metadata.createdAt,
  createdBy: metadata.createdBy.userId,
  versions: [{ version: 1, eventId: metadata.eventId }],
});
