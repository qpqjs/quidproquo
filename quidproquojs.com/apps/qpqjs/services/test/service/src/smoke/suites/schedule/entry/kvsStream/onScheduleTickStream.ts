import {
  askDateNow,
  askKeyValueStoreUpsert,
  AskResponse,
  KvsStreamEventResponse,
  KvsStreamRecord,
} from 'quidproquo';

import { SCHEDULE_TICK_STORE } from '../../constants/scheduleTickStore';
import { ScheduleTickRecord } from '../../models/ScheduleTickRecord';

/**
 * Stamps acknowledgedAt on a tick row the schedule has marked processed.
 *
 * The last link in the smoke chain: the test seeds a row, the schedule marks
 * it, and this proves the store's change stream delivered that change. Nothing
 * else in the suite exercises a stream, so a stream that stopped firing would
 * otherwise go unnoticed.
 *
 * It writes back into the store it streams from, which is the shape that
 * usually means an infinite loop. It terminates here because the guard is
 * self-limiting: the only write it makes is the one that sets acknowledgedAt,
 * and a row with acknowledgedAt already set falls out at the first line. So
 * one processed row costs exactly one extra no-op delivery, and testing that
 * no-op is part of the point - a handler writing to its own table is ordinary,
 * and getting the guard wrong is the interesting failure.
 */
export function* onScheduleTickStream(
  record: KvsStreamRecord<ScheduleTickRecord>
): AskResponse<KvsStreamEventResponse> {
  // Also covers the test's own seed write (no processedAt yet) and a Remove
  // (no new image at all), both of which arrive here and are not ours to act on.
  if (!record.newImage?.processedAt || record.newImage.acknowledgedAt) {
    return;
  }

  yield* askKeyValueStoreUpsert<ScheduleTickRecord>(SCHEDULE_TICK_STORE, {
    ...record.newImage,
    acknowledgedAt: yield* askDateNow(),
  });
}
