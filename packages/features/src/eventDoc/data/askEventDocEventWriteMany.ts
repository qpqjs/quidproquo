import { askKeyValueStoreUpsertMany, AskResponse } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EventDocEvent } from '../models';
import { eventDocEventToStoredEvent } from './storedEvent/eventDocEventToStoredEvent';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/**
 * Batch form of askEventDocEventWrite: claims every (modelId, eventId) slot or none. A taken slot surfaces as the
 * UpsertMany Conflict error with nothing written; askEventDocAppendServerEvents owns the re-lap.
 */
export function* askEventDocEventWriteMany(modelId: string, events: EventDocEvent[]): AskResponse<void> {
  const { eventsStoreName, type } = yield* askEventDocStoreReadOrThrow();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreUpsertMany(
    eventsStoreName,
    events.map((event) => eventDocEventToStoredEvent(modelId, type, event)),
    { ifNotExists: true, scope },
  );
}
