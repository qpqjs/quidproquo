import { askDelay, AskResponse } from 'quidproquo';
import { askEventDocEventListAll, EventDocEvent } from 'quidproquo-features';

import { askSmokeAssert } from '../askSmokeAssert';

const POLL_ATTEMPTS = 20;
const POLL_INTERVAL_MS = 2000;

// Poll a probe doc's log until it holds `expectedLength` events (INIT_STATE included),
// consistently read so a just-landed append is never missed. Fails the test if the
// writers have not all landed in time - a stuck writer (one that lost the slot race
// past its retry cap) shows up here as a short log. Assumes the store context.
export function* askAwaitSmokeEventDocLog(
  docId: string,
  expectedLength: number
): AskResponse<EventDocEvent[]> {
  let events: EventDocEvent[] = [];

  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    events = yield* askEventDocEventListAll(docId, { consistentRead: true });

    if (events.length >= expectedLength) {
      break;
    }

    yield* askDelay(POLL_INTERVAL_MS);
  }

  yield* askSmokeAssert(
    events.length === expectedLength,
    `expected ${expectedLength} events on doc [${docId}], found ${events.length}`
  );

  return events;
}
