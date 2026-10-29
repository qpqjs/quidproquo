import { QPQConfig } from '../../../QPQConfig';
import { UserScriptRunnerQPQConfigSetting } from '../types';
import { getUserScriptRunnerConfig } from './getUserScriptRunnerConfig';

export const resolveUserScriptRunnerConfigOrThrow = (qpqConfig: QPQConfig): UserScriptRunnerQPQConfigSetting => {
  const runner = getUserScriptRunnerConfig(qpqConfig);

  if (!runner) {
    throw new Error('This service has no user script runner: add defineUserScriptRunner() to its config');
  }

  return runner;
};
