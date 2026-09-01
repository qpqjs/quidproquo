import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { ScheduleTypeEnum } from './types/ScheduleTypeEnum';
import { defineRecurringSchedule } from './defineRecurringSchedule';
import { InvalidScheduleRecurrenceError } from './InvalidScheduleRecurrenceError';

const EVERY_MINUTE = { everyMinutes: 1 } as const;

describe('defineRecurringSchedule', () => {
  it('builds a recurring Schedule setting keyed by the runtime story name', () => {
    expect(defineRecurringSchedule({ dailyAtUtc: { hour: 3, minute: 0 } }, '/entry/cron::nightly')).toEqual({
      configSettingType: QPQCoreConfigSettingType.schedule,
      uniqueKey: 'nightly',
      scheduleType: ScheduleTypeEnum.Recurring,
      runtime: '/entry/cron::nightly',
      recurrence: { dailyAtUtc: { hour: 3, minute: 0 } },
      metadata: {},
      owner: undefined,
    });
  });

  it('defaults metadata to an empty object', () => {
    expect(defineRecurringSchedule(EVERY_MINUTE, '/entry/cron::tick').metadata).toEqual({});
  });

  it('passes supplied metadata through', () => {
    expect(defineRecurringSchedule(EVERY_MINUTE, '/entry/cron::tick', { metadata: { team: 'ops' } }).metadata).toEqual({ team: 'ops' });
  });

  it('passes maxConcurrentExecutions through', () => {
    expect(defineRecurringSchedule(EVERY_MINUTE, '/entry/cron::tick', { maxConcurrentExecutions: 2 }).maxConcurrentExecutions).toBe(2);
  });

  it('converts the owner to a resourceNameOverride', () => {
    expect(defineRecurringSchedule(EVERY_MINUTE, '/entry/cron::tick', { owner: { module: 'other', recurringSchedule: 'tick' } }).owner).toEqual({
      module: 'other',
      recurringSchedule: 'tick',
      resourceNameOverride: 'tick',
    });
  });

  it('rejects an unschedulable recurrence while the config is being evaluated', () => {
    // The whole reason define* validates: this throws at synth and at
    // dev-server boot, not at 03:07 on a Tuesday in production.
    expect(() => defineRecurringSchedule({ everyMinutes: 7 }, '/entry/cron::tick')).toThrow(InvalidScheduleRecurrenceError);
  });
});
