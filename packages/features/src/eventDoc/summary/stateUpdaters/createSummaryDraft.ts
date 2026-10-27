import { EventDocEventPayload, EventDocSummaryView } from '../../models';

/** Appends the next version (contiguous, 1-based) headed at this event's id. No-op when a draft is already open. */
export const createSummaryDraft = (model: EventDocSummaryView, { metadata }: EventDocEventPayload): EventDocSummaryView => {
  if (model.versions.some((version) => version.publishedAt === undefined)) {
    return model;
  }

  return {
    ...model,
    versions: [...model.versions, { version: model.versions.length + 1, eventId: metadata.eventId }],
  };
};
