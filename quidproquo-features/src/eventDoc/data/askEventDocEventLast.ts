import { askKeyValueStoreQuery, AskResponse, kvsEqual } from 'quidproquo-core';
import { Nullable } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocEvent } from '../models';
import { EventDocStoredEvent } from '../types/EventDocStoredEvent';
import { eventDocStoredEventToEvent } from './storedEvent/eventDocStoredEventToEvent';
import { askEventDocResolveScope } from './askEventDocResolveScope';

/**
 * The log head (newest event by numeric sort key), or null for an empty log. A writer reading back its own appends must
 * pass `consistentRead`: a stale head silently truncates everything clamped to it.
 */
export function* askEventDocEventLast(modelId: string, options?: { consistentRead?: boolean }): AskResponse<Nullable<EventDocEvent>> {
  const { eventsStoreName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  const page = yield* askKeyValueStoreQuery<EventDocStoredEvent>(eventsStoreName, kvsEqual('pk', modelId), {
    sortAscending: false,
    limit: 1,
    scope,
    consistentRead: options?.consistentRead,
  });

  const record = page.items[0];
  return record ? eventDocStoredEventToEvent(record) : null;
}
