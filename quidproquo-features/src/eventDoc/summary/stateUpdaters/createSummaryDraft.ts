import { EventDocEventPayload, EventDocSummaryView } from '../../models';

// CREATE_DRAFT appends the next version (versions are contiguous 1-based, so length + 1),
// seeding the new version's `eventId` head with this event's log id (the applier
// then advances it as further events append). If a draft is already open (an unpublished
// version exists) it's a no-op — validation rejects that case upstream, this stays robust.
export const createSummaryDraft = (model: EventDocSummaryView, { metadata }: EventDocEventPayload): EventDocSummaryView => {
  if (model.versions.some((version) => version.publishedAt === undefined)) {
    return model;
  }

  return {
    ...model,
    versions: [...model.versions, { version: model.versions.length + 1, eventId: metadata.eventId }],
  };
};
