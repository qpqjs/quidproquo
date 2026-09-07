import { AskResponse, Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { askEventDocEventList } from './askEventDocEventList';

// The id of the newest event stamped at or before `clock` — the log position "as of a
// time", found by walking the log BACKWARDS with an early exit: createdAt is stamped at
// append and appends commit in id order, so id order IS createdAt order and the first
// match wins. Cost tracks how many events landed AFTER the clock (usually none or a
// handful), never the log length. Null when the log has nothing at or before the clock.
export function* askEventDocEventIdAsOf(modelId: string, clock: QpqIsoDateTime): AskResponse<Nullable<number>> {
  let nextPageKey: string | undefined;

  do {
    const page = yield* askEventDocEventList(modelId, { sortDescending: true, nextPageKey, limit: 50 });

    for (const event of page.items) {
      if (event.payload.metadata.createdAt <= clock) {
        return event.payload.metadata.eventId;
      }
    }

    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return null;
}
