import { askKeyValueStoreUpsertWithRetry, AskResponse } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocEvent } from '../models';
import { eventDocEventToStoredEvent } from './storedEvent/eventDocEventToStoredEvent';
import { askEventDocResolveScope } from './askEventDocResolveScope';

// Events are immutable and uniquely keyed, so the write is CONDITIONAL: the
// (modelId, eventId) slot is claimed atomically, and a concurrent writer that
// computed the same id gets the namespaced Upsert Conflict instead of silently
// overwriting the event. Ordering, id assignment, validation and the
// conflict-retry live in the logic layer (askEventDocEventAppend).
export function* askEventDocEventWrite(modelId: string, event: EventDocEvent): AskResponse<void> {
  const { eventsStoreName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreUpsertWithRetry(eventsStoreName, eventDocEventToStoredEvent(modelId, type, event), { ifNotExists: true, scope });
}
