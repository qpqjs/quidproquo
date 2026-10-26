import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

/** Lambda's own ceiling on a function timeout. */
const MAX_TIMEOUT_IN_SECONDS = 15 * 60;
const MIN_MEMORY_IN_MIB = 128;
const MAX_MEMORY_IN_MIB = 10240;

export interface UserScriptRunnerQPQConfigSetting extends QPQConfigSetting {
  timeoutInSeconds: number;
  memoryInMiB: number;
  // Cap on concurrent script executions, carved out of the account's shared pool.
  maxConcurrentExecutions?: number;
  // Put the runner in this virtual network (one with no route out) to deny scripts the internet.
  virtualNetworkName?: string;
}

export type UserScriptRunnerOptions = {
  timeoutInSeconds?: number;
  memoryInMiB?: number;
  maxConcurrentExecutions?: number;
  virtualNetworkName?: string;
};

/**
 * Declares the sandbox that runs this service's user scripts: a separate function with its
 * own role that can write logs and nothing else, and only the pure action processors (date,
 * guid, log, math, error). `askUserScriptExecute` on this service invokes it; a service that
 * executes scripts without declaring one fails at synth. One per service.
 */
export const defineUserScriptRunner = (options: UserScriptRunnerOptions = {}): UserScriptRunnerQPQConfigSetting => {
  const timeoutInSeconds = options.timeoutInSeconds ?? 60;
  const memoryInMiB = options.memoryInMiB ?? 512;

  if (!Number.isInteger(timeoutInSeconds) || timeoutInSeconds < 1 || timeoutInSeconds > MAX_TIMEOUT_IN_SECONDS) {
    throw new Error(`defineUserScriptRunner: timeoutInSeconds [${timeoutInSeconds}] must be a whole number from 1 to ${MAX_TIMEOUT_IN_SECONDS}`);
  }
  if (!Number.isInteger(memoryInMiB) || memoryInMiB < MIN_MEMORY_IN_MIB || memoryInMiB > MAX_MEMORY_IN_MIB) {
    throw new Error(`defineUserScriptRunner: memoryInMiB [${memoryInMiB}] must be a whole number from ${MIN_MEMORY_IN_MIB} to ${MAX_MEMORY_IN_MIB}`);
  }

  return {
    configSettingType: QPQCoreConfigSettingType.userScriptRunner,
    uniqueKey: 'UserScriptRunner',

    timeoutInSeconds,
    memoryInMiB,
    maxConcurrentExecutions: options.maxConcurrentExecutions,
    virtualNetworkName: options.virtualNetworkName,
  };
};
