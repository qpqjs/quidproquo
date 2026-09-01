import { buildTestQpqConfig, defineRecurringSchedule, InvalidScheduleRecurrenceError } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { ResolvedDevServerConfig } from '../../types';
import { getDevServerScheduleJobs } from './getDevServerScheduleJobs';

const buildDevServerConfig = (settings: any[]): ResolvedDevServerConfig =>
  ({ qpqConfigs: [buildTestQpqConfig(settings)] }) as ResolvedDevServerConfig;

describe('getDevServerScheduleJobs', () => {
  it('arms one job per owned schedule, with its recurrence resolved', () => {
    const jobs = getDevServerScheduleJobs(buildDevServerConfig([defineRecurringSchedule({ everyMinutes: 10 }, '/s/poll::poll')]));

    expect(jobs).toHaveLength(1);
    expect(jobs[0].uniqueKey).toBe('poll');
    expect(jobs[0].fields.minutes).toEqual([0, 10, 20, 30, 40, 50]);
  });

  it('skips a schedule owned by another service', () => {
    // Every service's config is loaded into one dev server, so without this
    // each of them would fire the other's schedules.
    const jobs = getDevServerScheduleJobs(
      buildDevServerConfig([
        defineRecurringSchedule({ everyMinutes: 10 }, '/s/mine::mine'),
        defineRecurringSchedule({ everyMinutes: 10 }, '/s/theirs::theirs', { owner: { module: 'other-module', recurringSchedule: 'theirs' } }),
      ]),
    );

    expect(jobs.map((job) => job.uniqueKey)).toEqual(['mine']);
  });

  it('is empty when nothing declares a schedule', () => {
    expect(getDevServerScheduleJobs(buildDevServerConfig([]))).toEqual([]);
  });

  it('throws on an unschedulable recurrence rather than arming nothing', () => {
    // define* already rejects this, so getting here means a config was built
    // by hand. Failing at boot still beats a schedule that silently never
    // fires.
    const config = buildDevServerConfig([]);
    config.qpqConfigs[0].push({
      ...defineRecurringSchedule({ everyMinutes: 10 }, '/s/poll::poll'),
      recurrence: { everyMinutes: 7 },
    } as never);

    expect(() => getDevServerScheduleJobs(config)).toThrow(InvalidScheduleRecurrenceError);
  });
});
