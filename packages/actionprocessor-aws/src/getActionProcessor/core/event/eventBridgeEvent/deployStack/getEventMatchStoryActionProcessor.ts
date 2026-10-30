import {
  actionResult,
  actionResultError,
  askEventMatchStoryBase,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from '@qpqjs/core';

import { MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig, deployEventConfigName: string): ProcessorFor<typeof askEventMatchStoryBase> => {
  const deployConfig = qpqCoreUtils.getDeployEventByName(deployEventConfigName, qpqConfig);

  return async ({ qpqEventRecord }) => {
    if (!deployConfig) {
      return actionResultError(ErrorTypeEnum.NotFound, `Could not find deploy event config ${deployEventConfigName}`);
    }

    return actionResult<MatchResult>({
      runtime: deployConfig.runtime,
    });
  };
};

/** The deploy event the lambda serves comes from the handler, which reads it from the lambda environment once. */
export const getEventMatchStoryActionProcessor = (deployEventConfigName: string) =>
  createActionProcessor(askEventMatchStoryBase, (qpqConfig) => getProcessMatchStory(qpqConfig, deployEventConfigName));
