import { EventDocEvent } from '../../eventDoc/models';

/** The source user id would dangle in the target directory; the display name is a snapshot and stays true. */
export const toEventDocLocalActor = (event: EventDocEvent, importerUserId: string): EventDocEvent => ({
  ...event,
  payload: {
    ...event.payload,
    metadata: {
      ...event.payload.metadata,
      createdBy: { ...event.payload.metadata.createdBy, userId: importerUserId },
    },
  },
});
