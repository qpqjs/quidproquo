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

const GLOBAL_DEPLOY_EVENT_NAME = process.env.deployEventConfigName!;

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  const deployConfig = qpqCoreUtils.getDeployEventByName(GLOBAL_DEPLOY_EVENT_NAME, qpqConfig);

  return async ({ qpqEventRecord }) => {
    if (!deployConfig) {
      return actionResultError(ErrorTypeEnum.NotFound, `Could not find deploy event config ${GLOBAL_DEPLOY_EVENT_NAME}`);
    }

    return actionResult<MatchResult>({
      runtime: deployConfig.runtime,
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
