import { Nullable } from 'quidproquo-core';

import { scheduleMatchesUtcMinute, trackInFlight } from '../../logic';
import { DevServerPluginStop } from '../../plugins/types/DevServerPluginStop';
import { ResolvedDevServerConfig } from '../../types';
import { fireSchedule } from './fireSchedule';
import { getDevServerScheduleJobs } from './getDevServerScheduleJobs';

const MS_PER_MINUTE = 60 * 1000;

// The minute a Date falls in, as a comparable number. Firing is guarded on
// this rather than on elapsed time: a tick that arrives late still belongs to
// its own minute, and a tick that arrives twice for one minute must not fire
// twice.
const toUtcMinuteStamp = (at: Date): number => Math.floor(at.getTime() / MS_PER_MINUTE);

/**
 * Fire config-declared recurring schedules on the local clock.
 *
 * Deployed, each schedule is an EventBridge rule pointed at its own lambda.
 * There is no such thing locally, so without this a declared schedule simply
 * never runs on a dev machine and you find out what it does the first time you
 * ship it.
 *
 * One timer for every schedule, not one each: they all resolve against the
 * same minute, and a single aligned tick keeps that obvious.
 *
 * Accuracy: a blocked event loop can push a tick past a minute boundary, and
 * that minute is then skipped rather than fired late-and-twice (the stamp
 * guard below). Acceptable for a dev server, and the honest failure of the two.
 */
export const scheduleImplementation = async (devServerConfig: ResolvedDevServerConfig): Promise<Nullable<DevServerPluginStop>> => {
  // Throws on an unschedulable recurrence, which is the point: fail at boot
  // like a synth would, rather than never firing.
  const jobs = getDevServerScheduleJobs(devServerConfig);

  if (jobs.length === 0) {
    return null;
  }

  console.log(`[schedule] ${jobs.length} schedule(s) armed (utc):`);
  for (const job of jobs) {
    console.log(`[schedule]   ${job.serviceName}/${job.uniqueKey} ${JSON.stringify(job.schedule.recurrence)}`);
  }

  let lastFiredMinute: Nullable<number> = null;

  const tick = (): void => {
    const now = new Date();
    const minute = toUtcMinuteStamp(now);

    if (minute === lastFiredMinute) {
      return;
    }
    lastFiredMinute = minute;

    for (const job of jobs) {
      if (!scheduleMatchesUtcMinute(job.fields, now)) {
        continue;
      }

      // Tracked so a firing that is still running when the server is asked to
      // stop is drained rather than killed mid-story. Called synchronously
      // here, before any await, so a shutdown starting in this tick sees it.
      void trackInFlight(fireSchedule(job, devServerConfig, now));
    }
  };

  // Align to the next minute boundary before settling into a one-minute
  // interval, so schedules fire ON the minute rather than however many seconds
  // past it the dev server happened to start.
  let interval: Nullable<NodeJS.Timeout> = null;

  const alignment = setTimeout(
    () => {
      tick();
      interval = setInterval(tick, MS_PER_MINUTE);
    },
    MS_PER_MINUTE - (Date.now() % MS_PER_MINUTE),
  );

  return async () => {
    clearTimeout(alignment);
    if (interval) {
      clearInterval(interval);
    }
  };
};
