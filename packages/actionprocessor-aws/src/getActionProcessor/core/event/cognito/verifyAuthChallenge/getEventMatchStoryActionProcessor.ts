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

const getProcessMatchStory = (qpqConfig: QPQConfig, userDirectoryName: string): ProcessorFor<typeof askEventMatchStoryBase> => {
  const userDirectoryConfig = qpqCoreUtils.getUserDirectoryByName(userDirectoryName, qpqConfig);

  return async ({ qpqEventRecord }) => {
    if (!userDirectoryConfig?.customAuthRuntime?.verifyAuthChallenge) {
      return actionResultError(ErrorTypeEnum.NotFound, `Missing customAuthRuntime.verifyAuthChallenge in [${userDirectoryName}]`);
    }

    return actionResult<MatchResult>({
      runtime: userDirectoryConfig.customAuthRuntime.verifyAuthChallenge,
    });
  };
};

/** The user directory the lambda serves comes from the handler, which reads it from the lambda environment once. */
export const getEventMatchStoryActionProcessor = (userDirectoryName: string) =>
  createActionProcessor(askEventMatchStoryBase, (qpqConfig) => getProcessMatchStory(qpqConfig, userDirectoryName));
