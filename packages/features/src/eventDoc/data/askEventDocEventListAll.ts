import { askPagedDataDrain, AskResponse } from '@qpqjs/core';

import { EventDocEvent } from '../models';
import { askEventDocEventList } from './askEventDocEventList';

/**
 * The whole event log (or the slice between two ids) ascending, flat. Pass `consistentRead` when the caller just appended
 * and folds on the result; otherwise it may miss its own event.
 */
export function* askEventDocEventListAll(
  modelId: string,
  options?: { consistentRead?: boolean; afterEventId?: number; upToEventId?: number },
): AskResponse<EventDocEvent[]> {
  const { items } = yield* askPagedDataDrain(function* askEventPage(nextPageKey) {
    return yield* askEventDocEventList(modelId, {
      nextPageKey,
      consistentRead: options?.consistentRead,
      afterEventId: options?.afterEventId,
      upToEventId: options?.upToEventId,
    });
  });

  return items;
}
