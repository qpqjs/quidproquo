import { AskResponse } from 'quidproquo-core';

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
  const events: EventDocEvent[] = [];
  let nextPageKey: string | undefined;

  do {
    const page = yield* askEventDocEventList(modelId, {
      nextPageKey,
      consistentRead: options?.consistentRead,
      afterEventId: options?.afterEventId,
      upToEventId: options?.upToEventId,
    });
    events.push(...page.items);
    nextPageKey = page.nextPageKey;
  } while (nextPageKey);

  return events;
}
