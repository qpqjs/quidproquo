import { EventDocEvent, EventDocSummaryView } from '../models';
import { eventDocSummaryReducer } from './eventDocSummaryReducer';

// Apply one event to the record: fold the reserved handlers, then stamp updatedAt/
// updatedBy from the event so content edits bump "last modified" too (the reducer
// no-ops domain events). Every event also advances the current (tail) version's
// `eventId` to its own log id — so a version's head always points at its last
// event (a published version lands on its PUBLISH event; the open draft tracks the log
// head). That head is the cutoff to fold/render the version: events with id <= it.
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
