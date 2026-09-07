import { EventDocEvent } from '../../eventDoc/models';
import { EventDocLogComparison } from '../models';

// Identity is (type, eventId, version, clientMessageId, createdAt), never the payload data: deep-comparing would depend
// on JSON key order surviving a round trip through two stores. createdBy is excluded so re-attribution does not diverge.
const eventIdentity = (event: EventDocEvent): string => {
  const { eventId, version, clientMessageId, createdAt } = event.payload.metadata;

  return [event.type, eventId, version, clientMessageId, createdAt].join('|');
};

/** Whether `existing` is a prefix of `incoming` (import is fast-forward only), and if not, where they first disagree. */
export const findEventDocLogDivergence = (existing: EventDocEvent[], incoming: EventDocEvent[]): EventDocLogComparison => {
  const sharedLength = Math.min(existing.length, incoming.length);

  for (let index = 0; index < sharedLength; index += 1) {
    if (eventIdentity(existing[index]) !== eventIdentity(incoming[index])) {
      return { diverged: true, atIndex: index };
    }
  }

  return {
    diverged: false,
    sharedCount: sharedLength,
    existingAhead: existing.length > incoming.length,
  };
};
