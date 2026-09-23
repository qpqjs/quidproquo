import { AskResponse } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocEventLast } from '../data/askEventDocEventLast';
import { askEventDocProjectAtEvent } from './askEventDocProjectAtEvent';

/**
 * Re-run the projector at a document's log head under the collection's current snapshot cache key: the summary row is
 * rewritten and a fresh snapshot set is filed under the current key. The reseed primitive for an admin job after a key
 * change (an in-place fold change), run inside the document's storage scope. A document with no events is a no-op.
 * Returns true when a projection ran.
 */
export function* askEventDocReprojectHead(modelId: string): AskResponse<boolean> {
  const { storeName, type } = yield* askEventDocResolveStore();
  const head = yield* askEventDocEventLast(modelId);

  if (!head) {
    return false;
  }

  yield* askEventDocProjectAtEvent(modelId, head.payload.metadata.eventId, eventDocFunctionsName(storeName, type));

  return true;
}
