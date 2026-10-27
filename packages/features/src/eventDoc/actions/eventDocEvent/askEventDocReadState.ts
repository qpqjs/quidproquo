import { createActionRequester } from 'quidproquo-core';

import { EventDocActionType } from './EventDocActionType';

/**
 * Yields the ReadState action; the enclosing slot binding answers with the doc's current folded state.
 * Processors must honour read-your-own-writes (an apply earlier in the same story is visible) and fail loudly when unbound.
 * Call through a per-doc createEventDocStateReader for a typed result.
 */
export const askEventDocReadState = createActionRequester<unknown>()({
  actionType: EventDocActionType.ReadState,
});
