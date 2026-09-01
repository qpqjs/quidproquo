import { qpqCoreUtils, resolveScheduleFields } from 'quidproquo-core';

import { ResolvedDevServerConfig } from '../../types';
import { DevServerScheduleJob } from './types';

/**
 * Every schedule this dev server should tick.
 *
 * Only the service that OWNS a schedule arms it, or every service loaded into
 * the dev server would fire the same one - the same rule kvsStreamImplementation
 * follows for stores.
 *
 * `resolveScheduleFields` can throw here, and is meant to: an unschedulable
 * recurrence should stop the dev server at boot with a clear error, exactly as
 * it would stop a synth, rather than quietly never firing.
 */
export const getDevServerScheduleJobs = (devServerConfig: ResolvedDevServerConfig): DevServerScheduleJob[] => {
  return devServerConfig.qpqConfigs.flatMap((qpqConfig) => {
    const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

    return qpqCoreUtils.getOwnedScheduleEvents(qpqConfig).map((schedule) => ({
      serviceName,
      uniqueKey: schedule.uniqueKey,
      qpqConfig,
      schedule,
      fields: resolveScheduleFields(schedule.recurrence),
    }));
  });
};
