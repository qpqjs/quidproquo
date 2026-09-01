import { generateUuid, QpqFunctionRuntime, QpqRuntimeType } from 'quidproquo-core';

import { getScheduleEventProcessor } from '../../actionProcessor/core/event/schedule';
import { ScheduleMessageWithSession } from '../../actionProcessor/core/event/schedule/types';
import { processEvent } from '../../logic';
import { ResolvedDevServerConfig } from '../../types';
import { DevServerScheduleJob } from './types';

const getDynamicModuleLoader = (job: DevServerScheduleJob, devServerConfig: ResolvedDevServerConfig) => {
  return async (runtime: QpqFunctionRuntime): Promise<any> => devServerConfig.dynamicModuleLoader(job.serviceName, runtime);
};

/**
 * Run one schedule once, as though its minute had come up.
 *
 * Shared by the ticker and by the on-demand fire endpoint, so a schedule
 * triggered by hand goes down exactly the same path as one triggered by the
 * clock.
 *
 * A failing story is logged, never rethrown: deployed, a failed EventBridge
 * invocation is that invocation's problem and the rule keeps its schedule, so
 * killing the local ticker instead would be a difference that only shows up on
 * dev.
 */
export const fireSchedule = async (job: DevServerScheduleJob, devServerConfig: ResolvedDevServerConfig, firedAt: Date): Promise<void> => {
  const message: ScheduleMessageWithSession = {
    storySession: { depth: 0, context: {} },
    runtime: job.schedule.runtime,
    record: {
      time: firedAt.toISOString(),
      correlation: generateUuid(),
      metadata: job.schedule.metadata,
    },
  };

  try {
    await processEvent<ScheduleMessageWithSession, void>(
      message,
      job.qpqConfig,
      getDynamicModuleLoader(job, devServerConfig),
      getScheduleEventProcessor,
      QpqRuntimeType.RECURRING_SCHEDULE,
      (event) => event.storySession,
      devServerConfig,
    );
  } catch (error) {
    console.error(`[schedule] ${job.serviceName}/${job.uniqueKey} failed:`, error);
  }
};
