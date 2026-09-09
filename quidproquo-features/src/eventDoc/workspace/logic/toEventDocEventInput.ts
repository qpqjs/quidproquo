import { EventDocEvent, EventDocEventInput } from '../../models';

/** Strips a buffered event to the client-owned fields for the append POST; the backend stamps the rest. */
export const toEventDocEventInput = (event: EventDocEvent): EventDocEventInput => ({
  type: event.type,
  payload: {
    data: event.payload.data,
    metadata: {
      version: event.payload.metadata.version,
      clientMessageId: event.payload.metadata.clientMessageId,
    },
  },
});
