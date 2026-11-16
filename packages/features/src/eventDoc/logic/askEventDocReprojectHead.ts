import { AskResponse } from '@qpqjs/core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { askEventDocEventLast } from '../data/askEventDocEventLast';
import { askEventDocProjectAtEvent } from './askEventDocProjectAtEvent';
import { askEventDocSummaryRederive } from './askEventDocSummaryRederive';

/**
 * Re-run the projector at a document's log head under the collection's current snapshot cache key: every list view row
 * is rewritten and a fresh snapshot set is filed under the current key. The reseed primitive behind the reproject job,
 * run inside the document's storage scope. `functionsName` overrides the registry name derived from the store context.
 * A document with no events has its list view rows removed instead. Returns true when a projection ran.
 */
export function* askEventDocReprojectHead(modelId: string, functionsName?: string): AskResponse<boolean> {
  const { storeName, type } = yield* askEventDocStoreReadOrThrow();
  const head = yield* askEventDocEventLast(modelId);

  if (!head) {
    yield* askEventDocSummaryRederive(modelId);

    return false;
  }

  yield* askEventDocProjectAtEvent(modelId, head.payload.metadata.eventId, functionsName ?? eventDocFunctionsName(storeName, type));

  return true;
}
