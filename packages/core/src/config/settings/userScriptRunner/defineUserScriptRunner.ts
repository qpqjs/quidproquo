import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { UserScriptRunnerOptions, UserScriptRunnerQPQConfigSetting } from './types';

/**
 * Declares the sandbox that runs this service's user scripts: a separate function with its
 * own role that can write logs and nothing else, and only the pure action processors (date,
 * guid, log, math, error). `askUserScriptExecute` on this service invokes it; a service that
 * executes scripts without declaring one fails at synth. One per service.
 */
export const defineUserScriptRunner = (options: UserScriptRunnerOptions = {}): UserScriptRunnerQPQConfigSetting => {
  const timeoutInSeconds = options.timeoutInSeconds ?? 60;
  const memoryInMiB = options.memoryInMiB ?? 512;

  // Whole, positive numbers; the platform's own ceilings are checked where it deploys the runner.
  if (!Number.isInteger(timeoutInSeconds) || timeoutInSeconds < 1) {
    throw new Error(`defineUserScriptRunner: timeoutInSeconds [${timeoutInSeconds}] must be a whole number of at least 1`);
  }
  if (!Number.isInteger(memoryInMiB) || memoryInMiB < 1) {
    throw new Error(`defineUserScriptRunner: memoryInMiB [${memoryInMiB}] must be a whole number of at least 1`);
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
