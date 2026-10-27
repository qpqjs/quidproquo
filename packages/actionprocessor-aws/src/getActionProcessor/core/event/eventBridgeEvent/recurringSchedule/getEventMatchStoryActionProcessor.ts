import {
  actionResult,
  actionResultError,
  askEventMatchStoryBase,
  createActionProcessor,
  EventActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { LambdaRuntimeConfig } from '../../../../../runtimeConfig/LambdaRuntimeConfig';
import { EventInput, InternalEventRecord, MatchResult } from './types';

// TODO: Clean this shit up
const lambdaRuntimeConfig: LambdaRuntimeConfig = JSON.parse(process.env.lambdaRuntimeConfig || '{}');

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async ({ qpqEventRecord }) => {
    return actionResult<MatchResult>({
      runtime: lambdaRuntimeConfig.runtime,
      runtimeOptions: {},
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
