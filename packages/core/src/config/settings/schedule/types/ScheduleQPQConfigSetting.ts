import { CrossModuleOwner, QpqFunctionRuntime } from '../../../../types';
import { QPQConfigSetting } from '../../../QPQConfig';
import { ScheduleRecurrence } from './ScheduleRecurrence';
import { ScheduleTypeEnum } from './ScheduleTypeEnum';

export interface ScheduleQPQConfigSetting extends QPQConfigSetting {
  scheduleType: ScheduleTypeEnum;

  runtime: QpqFunctionRuntime;

  // Platform-neutral. The AWS cron string is rendered from this at deploy
  // time; it is deliberately not stored.
  recurrence: ScheduleRecurrence;

  metadata: Record<string, any>;

  maxConcurrentExecutions?: number;

  owner?: CrossModuleOwner;
}
