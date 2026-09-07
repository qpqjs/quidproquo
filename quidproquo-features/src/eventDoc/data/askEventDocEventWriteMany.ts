import { askKeyValueStoreUpsertMany, AskResponse } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocEvent } from '../models';
import { eventDocEventToStoredEvent } from './storedEvent/eventDocEventToStoredEvent';
import { askEventDocResolveScope } from './askEventDocResolveScope';

// The batch sibling of askEventDocEventWrite: one UpsertMany action for a whole
// burst of events, CONDITIONAL like the single write — ifNotExists makes it a
// transaction that claims every (modelId, eventId) slot or none, so a concurrent
// writer that took any slot in the run surfaces as the UpsertMany Conflict with
// nothing written. The logic layer (askEventDocAppendServerEvents) owns the
// re-read-and-re-lap.
export function* askEventDocEventWriteMany(modelId: string, events: EventDocEvent[]): AskResponse<void> {
  const { eventsStoreName, type } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  yield* askKeyValueStoreUpsertMany(
    eventsStoreName,
    events.map((event) => eventDocEventToStoredEvent(modelId, type, event)),
    { ifNotExists: true, scope },
  );
}
