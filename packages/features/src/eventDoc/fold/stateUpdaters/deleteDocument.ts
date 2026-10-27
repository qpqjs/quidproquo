import { EventDocDocument, EventDocEventPayload } from '../../models';

/** Soft-deletes, stamping who and when from the event. Everything else survives, so RESTORE puts it back as it was. */
export const deleteDocument = <TState extends EventDocDocument>(state: TState, { metadata }: EventDocEventPayload): TState => ({
  ...state,
  deletedAt: metadata.createdAt,
  deletedBy: metadata.createdBy.userId,
});
