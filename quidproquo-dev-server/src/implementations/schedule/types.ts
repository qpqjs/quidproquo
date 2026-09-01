import { QPQConfig, ScheduleFields, ScheduleQPQConfigSetting } from 'quidproquo-core';

// One armed schedule: the config that declared it, and its recurrence already
// resolved. Resolving once at boot rather than per tick means an unschedulable
// recurrence fails at startup, and the minute loop stays a pure comparison.
export type DevServerScheduleJob = {
  serviceName: string;
  uniqueKey: string;

  qpqConfig: QPQConfig;
  schedule: ScheduleQPQConfigSetting;
  fields: ScheduleFields;
};
