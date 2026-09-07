import { AskResponse } from 'quidproquo';
import { EventDocEvent } from 'quidproquo-features';

import { askSmokeAssert } from '../askSmokeAssert';

// The whole point of numeric event ids: an ascending list read of the log is exactly
// 0, 1, 2, ... with no hole and no repeat, whatever order the writers raced in.
export function* askAssertContiguousEventIds(
  events: EventDocEvent[]
): AskResponse<void> {
  const ids = events.map((event) => event.payload.metadata.eventId);
  const expected = ids.map((_, index) => index);

  yield* askSmokeAssert(
    ids.every((id, index) => id === expected[index]),
    `event ids are not contiguous from 0: [${ids.join(', ')}]`
  );
}
