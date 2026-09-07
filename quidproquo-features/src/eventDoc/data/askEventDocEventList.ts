import { askKeyValueStoreQuery, AskResponse, kvsAnd, kvsBetween, kvsEqual, kvsGreaterThan, kvsLessThanOrEqual, QpqPagedData } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocEvent } from '../models';
import { EventDocStoredEvent } from '../types/EventDocStoredEvent';
import { eventDocStoredEventToEvent } from './storedEvent/eventDocStoredEventToEvent';
import { askEventDocResolveScope } from './askEventDocResolveScope';

export type EventDocEventListOptions = {
  limit?: number;
  // Read the writer's own most recent appends. Needed by a caller that appended and is now folding to
  // decide something; not needed by a viewer. Costs twice the read capacity, so it stays opt-in.
  consistentRead?: boolean;
  nextPageKey?: string;
  // Return only events whose log id is greater than this (exclusive) — the tail since a known
  // point, for an incremental refresh. The events store is keyed pk=modelId / sk=eventId on its
  // primary key, so this is a sort-key range condition (no GSI involved).
  afterEventId?: number;
  // Return only events whose log id is at or before this (inclusive) — the PREFIX up to a known
  // event, for folding the document as of that event (a snapshot). Combined with afterEventId it
  // reads the slice between two known points — the gap an incremental fold applies on top of a
  // snapshot's state.
  upToEventId?: number;
  // Newest first. For display reads that walk BACKWARDS in time (the history panel's
  // latest-page-then-load-older). Folding reads never set this — a fold consumes the log
  // in order.
  sortDescending?: boolean;
};

// The sort-key condition for the requested slice. A DynamoDB key condition permits ONE
// condition per key, so the two-ended case must be a kvsBetween — which is inclusive at
// both ends, while afterEventId is exclusive. The boundary row (sk === afterEventId) is
// therefore dropped after the read: one known extra row per query, rather than a second
// key condition the store would reject.
const eventRangeCondition = (options?: EventDocEventListOptions) => {
  if (options?.afterEventId !== undefined && options?.upToEventId !== undefined) {
    return kvsBetween('sk', options.afterEventId, options.upToEventId);
  }
  if (options?.afterEventId !== undefined) {
    return kvsGreaterThan('sk', options.afterEventId);
  }
  if (options?.upToEventId !== undefined) {
    return kvsLessThanOrEqual('sk', options.upToEventId);
  }
  return undefined;
};

export function* askEventDocEventList(modelId: string, options?: EventDocEventListOptions): AskResponse<QpqPagedData<EventDocEvent>> {
  const { eventsStoreName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  // An ascending continuation is positioned by its cursor, not by afterEventId — the cursor
  // is at or past the lower bound the first page ran with. Keeping BOTH is not just redundant,
  // it races: a caller (e.g. the bootstrap page) that re-derives afterEventId per page can see a
  // snapshot written BETWEEN pages land exactly on the cursor's event, making the condition
  // `sk > cursor.sk` — and DynamoDB rejects a starting key outside the range key predicate
  // (ValidationException). Descending reads keep afterEventId: there it is the termination
  // bound at the far end of the scan and can never contradict the cursor.
  const effectiveOptions = options?.nextPageKey && !options.sortDescending ? { ...options, afterEventId: undefined } : options;

  const rangeCondition = eventRangeCondition(effectiveOptions);
  const keyCondition = rangeCondition ? kvsAnd([kvsEqual('pk', modelId), rangeCondition]) : kvsEqual('pk', modelId);

  const page = yield* askKeyValueStoreQuery<EventDocStoredEvent>(eventsStoreName, keyCondition, {
    sortAscending: !options?.sortDescending,
    limit: options?.limit,
    nextPageKey: options?.nextPageKey,
    consistentRead: options?.consistentRead,
    scope,
  });

  return {
    nextPageKey: page.nextPageKey,
    // The between's inclusive lower boundary — see eventRangeCondition. Only one page can
    // contain it (the first ascending, the last descending); filtering every page is
    // harmless.
    items: page.items.filter((record) => record.sk !== options?.afterEventId).map((record) => eventDocStoredEventToEvent(record)),
  };
}
