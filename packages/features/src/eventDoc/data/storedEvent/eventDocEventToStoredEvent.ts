import type { EventDocEvent } from '../../models';
import type { EventDocStoredEvent } from '../../types/EventDocStoredEvent';

/** Wraps an event as a stored row (pk=modelId, sk=eventId). `modelId` and `type` come from the handler, not the event. */
export const eventDocEventToStoredEvent = (modelId: string, type: string, event: EventDocEvent): EventDocStoredEvent => ({
  pk: modelId,
  sk: event.payload.metadata.eventId,
  type,
  data: event,
});
