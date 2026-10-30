import { QPQConfigSetting } from '../../../QPQConfig';

export type UserScriptRunnerQPQConfigSetting = {
  timeoutInSeconds: number;
  memoryInMiB: number;
  // Cap on concurrent script executions, carved out of the account's shared pool.
  maxConcurrentExecutions?: number;
  // Put the runner in this virtual network (one with no route out) to deny scripts the internet.
  virtualNetworkName?: string;
} & QPQConfigSetting;
