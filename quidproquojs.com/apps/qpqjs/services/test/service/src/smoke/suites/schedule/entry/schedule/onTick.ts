import {
  askKeyValueStoreGet,
  askKeyValueStoreUpsert,
  askLogCreate,
  AskResponse,
  LogLevelEnum,
  ScheduledEventParams,
} from 'quidproquo';

import { SCHEDULE_TICK_NAME } from '../../constants/scheduleTickName';
import { SCHEDULE_TICK_STORE } from '../../constants/scheduleTickStore';
import { ScheduleTickRecord } from '../../models/ScheduleTickRecord';

/**
 * The heartbeat. Deployed this is an EventBridge rule; locally the dev
 * server's ticker fires it on the same minute.
 *
 * Marks a pending request as processed, and does nothing when there is no
 * request outstanding - so between smoke runs this is a log line and a read,
 * not a write every minute forever.
 *
 * Records the event's own `time` rather than reading a clock, because that is
 * what the scheduler believes the firing minute to be, and agreement on that
 * between the two runtimes is the thing worth proving.
 */
export function* onTick(event: ScheduledEventParams): AskResponse<void> {
  yield* askLogCreate(
    LogLevelEnum.Info,
    `tick ${event.time} (correlation ${event.correlation})`
  );

  const pending = yield* askKeyValueStoreGet<ScheduleTickRecord>(
    SCHEDULE_TICK_STORE,
    SCHEDULE_TICK_NAME
  );

  if (!pending || pending.processedAt) {
    return;
  }

  yield* askKeyValueStoreUpsert<ScheduleTickRecord>(SCHEDULE_TICK_STORE, {
    ...pending,
    processedAt: event.time,
  });
}
