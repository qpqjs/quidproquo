import { askKeyValueStoreUpsertWithRetry, AskResponse } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EventDocEvent } from '../models';
import { eventDocEventToStoredEvent } from './storedEvent/eventDocEventToStoredEvent';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/**
 * Conditionally claims the (modelId, eventId) slot; a concurrent writer with the same id gets the Upsert Conflict error.
 * Id assignment and the conflict re-lap live in askEventDocEventAppend.
 */
export function* askEventDocEventWrite(modelId: string, event: EventDocEvent): AskResponse<void> {
  const { eventsStoreName, type } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreUpsertWithRetry(eventsStoreName, eventDocEventToStoredEvent(modelId, type, event), { ifNotExists: true, scope });
}
