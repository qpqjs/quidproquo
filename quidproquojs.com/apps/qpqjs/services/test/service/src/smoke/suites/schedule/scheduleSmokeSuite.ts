import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineScheduleSmoke } from './config/defineScheduleSmoke';
import { askRunScheduleTest } from './logic/askRunScheduleTest';

/** A per-minute schedule and a kvs change stream, proven in one wait. */
export const scheduleSmokeSuite: SmokeSuite = {
  defineConfig: defineScheduleSmoke,
  tests: [{ name: 'schedule', askRun: askRunScheduleTest }],
};
