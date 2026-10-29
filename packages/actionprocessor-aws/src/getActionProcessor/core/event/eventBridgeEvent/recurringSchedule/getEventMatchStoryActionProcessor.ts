import { actionResult, askEventMatchStoryBase, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { LambdaRuntimeConfig } from '../../../../../runtimeConfig/LambdaRuntimeConfig';
import { MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig, lambdaRuntimeConfig: LambdaRuntimeConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async ({ qpqEventRecord }) => {
    return actionResult<MatchResult>({
      runtime: lambdaRuntimeConfig.runtime,
      runtimeOptions: {},
    });
  };
};

/** The schedule's story comes from the handler, which reads the lambda environment once. */
export const getEventMatchStoryActionProcessor = (lambdaRuntimeConfig: LambdaRuntimeConfig) =>
  createActionProcessor(askEventMatchStoryBase, (qpqConfig) => getProcessMatchStory(qpqConfig, lambdaRuntimeConfig));
