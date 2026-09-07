import { askKeyValueStoreQuery, AskResponse, kvsEqual } from 'quidproquo-core';
import { Nullable } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocEvent } from '../models';
import { EventDocStoredEvent } from '../types/EventDocStoredEvent';
import { eventDocStoredEventToEvent } from './storedEvent/eventDocStoredEventToEvent';
import { askEventDocResolveScope } from './askEventDocResolveScope';

// Tail of the log — the newest event by sort key. Event ids are contiguous numbers, so
// numeric sort-key order (DynamoDB's, and the dev-server's for numbers) is log order and
// this returns the true head.
//
// `consistentRead` matters MORE here than on any other event read: this is how
// "latest" resolvers pick the head everything else clamps to. A stale replica
// answering this query doesn't just delay data — it silently truncates the log
// (or empties it: no rows -> null -> callers fall back to pristine state), and a
// consistent gap read clamped to a stale head inherits the truncation. A writer
// reading back its own appends must pass it.
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
