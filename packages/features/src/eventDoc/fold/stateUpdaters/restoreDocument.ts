import { EventDocDocument, EventDocEventPayload } from '../../models';

/** Clears the soft delete. The DELETE stays in the log; this is a later fact superseding it. */
export const restoreDocument = <TState extends EventDocDocument>(state: TState, _payload: EventDocEventPayload): TState => ({
  ...state,
  deletedAt: undefined,
  deletedBy: undefined,
});
