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

const GLOBAL_USER_DIRECTORY_NAME = process.env.userDirectoryName!;

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  const userDirectoryConfig = qpqCoreUtils.getUserDirectoryByName(GLOBAL_USER_DIRECTORY_NAME, qpqConfig);

  return async ({ qpqEventRecord }) => {
    if (!userDirectoryConfig?.customAuthRuntime?.createAuthChallenge) {
      return actionResultError(ErrorTypeEnum.NotFound, `Missing customAuthRuntime.createAuthChallenge in [${GLOBAL_USER_DIRECTORY_NAME}]`);
    }

    return actionResult<MatchResult>({
      runtime: userDirectoryConfig.customAuthRuntime.createAuthChallenge,
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
