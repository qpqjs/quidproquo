import {
  defineKeyValueStore,
  defineRecurringSchedule,
  QPQConfig,
} from 'quidproquo';

import { SCHEDULE_TICK_STORE } from '../constants/scheduleTickStore';
import { ScheduleTickRecord } from '../models/ScheduleTickRecord';

/**
 * A heartbeat schedule, and the one row that lets a test prove it fired.
 *
 * The chain the smoke suite's schedule test drives, all on a single record:
 *
 *   test seeds it     ->  the schedule stamps processedAt
 *                     ->  the store's stream stamps acknowledgedAt
 *                     ->  the test sees acknowledgedAt for its own run
 *
 * One wait covers three things that are otherwise untested together: that a
 * declared schedule fires at all, that it fires the same way locally as
 * deployed, and that a key-value store's change stream delivers.
 *
 * Every minute, which is the fastest a schedule can go and the only cadence a
 * test can reasonably wait out.
 */
export const defineTick = (): QPQConfig => [
  defineKeyValueStore<ScheduleTickRecord>(
    SCHEDULE_TICK_STORE,
    'scheduleName',
    [],
    {
      onStream: {
        runtime: {
          basePath: __dirname,
          relativePath: '../entry/kvsStream/onScheduleTickStream',
          functionName: 'onScheduleTickStream',
        },
      },
    }
  ),

  defineRecurringSchedule(
    { everyMinutes: 1 },
    {
      basePath: __dirname,
      relativePath: '../entry/schedule/onTick',
      functionName: 'onTick',
    }
  ),
];
