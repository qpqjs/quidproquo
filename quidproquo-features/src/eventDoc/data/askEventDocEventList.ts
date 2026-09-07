import { askKeyValueStoreQuery, AskResponse, kvsAnd, kvsBetween, kvsEqual, kvsGreaterThan, kvsLessThanOrEqual, QpqPagedData } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocEvent } from '../models';
import { EventDocStoredEvent } from '../types/EventDocStoredEvent';
import { eventDocStoredEventToEvent } from './storedEvent/eventDocStoredEventToEvent';
import { askEventDocResolveScope } from './askEventDocResolveScope';

export type EventDocEventListOptions = {
  limit?: number;
  // Required when the caller just appended and is folding on the result; doubles read cost.
  consistentRead?: boolean;
  nextPageKey?: string;
  // Exclusive lower bound on the event id.
  afterEventId?: number;
  // Inclusive upper bound on the event id.
  upToEventId?: number;
  sortDescending?: boolean;
};

// DynamoDB allows one condition per key, so the two-ended case is a kvsBetween (inclusive both ends). afterEventId is
// exclusive, so the boundary row (sk === afterEventId) is dropped after the read.
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

/** One page of a document's events from the `${storeName}Events` store (pk=modelId, sk=eventId). */
export function* askEventDocEventList(modelId: string, options?: EventDocEventListOptions): AskResponse<QpqPagedData<EventDocEvent>> {
  const { eventsStoreName } = yield* askEventDocResolveStore();
  const scope = yield* askEventDocResolveScope();

  // An ascending continuation is positioned by its cursor. Keeping afterEventId too can race (a snapshot landing between
  // pages moves it onto the cursor's event) and DynamoDB rejects a start key outside the key condition.
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
    // Drops the inclusive lower boundary row, see eventRangeCondition.
    items: page.items.filter((record) => record.sk !== options?.afterEventId).map((record) => eventDocStoredEventToEvent(record)),
  };
}
