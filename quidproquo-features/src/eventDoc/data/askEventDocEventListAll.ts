import { AskResponse } from 'quidproquo-core';

import { EventDocEvent } from '../models';
import { askEventDocEventList } from './askEventDocEventList';

// Page through the whole event log (ascending) and return it flat — the complete history
// a from-scratch fold needs, or the slice between two known positions.
//
// `consistentRead` is for the caller that JUST APPENDED and is now folding to decide something — the
// default read is eventually consistent, so such a caller can otherwise miss its own most recent event and
// conclude the document says something it does not. Leave it off for ordinary reads: it doubles the read
// cost and buys nothing when nobody is racing a write.
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
