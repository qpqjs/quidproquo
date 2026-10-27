import { AskResponse, Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { askEventDocEventList } from './askEventDocEventList';

/**
 * Id of the newest event created at or before `clock`, or null. Walks backwards and stops at the first match:
 * appends commit in id order, so id order is createdAt order.
 */
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
