import { CrossModuleOwner } from '../../../../types';
import { QPQConfigAdvancedSettings } from '../../../QPQConfig';

export type QPQConfigAdvancedScheduleSettings = {
  metadata?: Record<string, any>;
  owner?: CrossModuleOwner<'recurringSchedule'>;

  // Cap (and guarantee) on this schedule's concurrent executions: never
  // throttled below it, never scales above it. Free, but carved out of the
  // deploy account's shared concurrency pool.
  maxConcurrentExecutions?: number;
} & QPQConfigAdvancedSettings;
