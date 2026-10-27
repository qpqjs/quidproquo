import { askKeyValueStoreUpsertMany, AskResponse } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocEvent } from '../models';
import { eventDocEventToStoredEvent } from './storedEvent/eventDocEventToStoredEvent';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/**
 * Batch form of askEventDocEventWrite: claims every (modelId, eventId) slot or none. A taken slot surfaces as the
 * UpsertMany Conflict error with nothing written; askEventDocAppendServerEvents owns the re-lap.
 */
export function* askEventDocEventWriteMany(modelId: string, events: EventDocEvent[]): AskResponse<void> {
  const { eventsStoreName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreUpsertMany(
    eventsStoreName,
    events.map((event) => eventDocEventToStoredEvent(modelId, type, event)),
    { ifNotExists: true, scope },
  );
}
