import {
  askDateNow,
  askDelay,
  askKeyValueStoreGet,
  askKeyValueStoreUpsert,
  AskResponse,
  Nullable,
} from 'quidproquo';

import { SCHEDULE_TICK_NAME } from '../../../tick/constants/scheduleTickName';
import { SCHEDULE_TICK_STORE } from '../../../tick/constants/scheduleTickStore';
import { ScheduleTickRecord } from '../../../tick/models/ScheduleTickRecord';
import { askSmokeAssert } from '../askSmokeAssert';

// The schedule runs every minute, so the wait has to cover a full boundary
// plus the stream hop after it. Generous rather than tight: the first fire
// after a deploy is the slowest one, and a flake here blocks a deploy.
const POLL_ATTEMPTS = 40;
const POLL_INTERVAL_MS = 3000;

// Which link stalled, from the state the chain left behind. Worth the few
// lines: "the schedule never fired" and "the stream never fired" send you to
// completely different places, and a bare timeout says neither.
const describeStall = (
  tick: Nullable<ScheduleTickRecord>,
  runId: string
): string => {
  if (!tick) {
    return 'the seeded tick row is gone, so something else deleted it';
  }

  if (tick.runId !== runId) {
    return `the tick row now belongs to run [${tick.runId}], so a concurrent smoke run overwrote it`;
  }

  if (!tick.processedAt) {
    return 'the schedule never fired: the row was never marked processed';
  }

  return `the schedule fired at ${tick.processedAt} but the store's stream never acknowledged it`;
};

/**
 * Proves a recurring schedule fires, and that a key-value store's change
 * stream delivers, in one wait.
 *
 * Seeds one row stamped with this run, then waits for that same row to come
 * back acknowledged - which only happens if the schedule picked it up and
 * stamped processedAt, and the store's stream then saw that change and stamped
 * acknowledgedAt. Deployed that is an EventBridge rule and a DynamoDB stream;
 * locally it is the dev server's ticker and its stream implementation. Same
 * assertion either way.
 *
 * Matching on the run id is what makes this unambiguous without deleting
 * anything first: a stale row is one that does not match, so there is never a
 * window where the record is missing, and never a question of whether what was
 * read is recent enough to count.
 *
 * Slow by nature - up to a minute of real time, because that is how long a
 * per-minute schedule can take to come round.
 */
export function* askRunScheduleTest(runId: string): AskResponse<void> {
  yield* askKeyValueStoreUpsert<ScheduleTickRecord>(SCHEDULE_TICK_STORE, {
    scheduleName: SCHEDULE_TICK_NAME,
    runId,
    requestedAt: yield* askDateNow(),
  });

  let tick: Nullable<ScheduleTickRecord> = null;

  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt += 1) {
    yield* askDelay(POLL_INTERVAL_MS);

    tick = yield* askKeyValueStoreGet<ScheduleTickRecord>(
      SCHEDULE_TICK_STORE,
      SCHEDULE_TICK_NAME
    );

    if (tick?.runId === runId && tick.acknowledgedAt) {
      return;
    }
  }

  yield* askSmokeAssert(
    false,
    `no acknowledgement within ${(POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000}s: ${describeStall(tick, runId)}`
  );
}
