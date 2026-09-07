import { EventDocEvent, EventDocSummaryView } from '../models';
import { eventDocSummaryReducer } from './eventDocSummaryReducer';

/**
 * Apply one event to the summary: fold the reserved handlers, stamp updatedAt/updatedBy, and advance the tail version's
 * `eventId` to this event's id, so a version's head is always its last event (the cutoff to fold or render it).
 */
export const applyEventDocSummaryEvent = (model: EventDocSummaryView, event: EventDocEvent): EventDocSummaryView => {
  const [next] = eventDocSummaryReducer(model, event);
  const { eventId, createdAt, createdBy } = event.payload.metadata;
  const tail = next.versions.length - 1;

  return {
    ...next,
    updatedAt: createdAt,
    updatedBy: createdBy.userId,
    versions: next.versions.map((version, i) => (i === tail ? { ...version, eventId } : version)),
  };
};
