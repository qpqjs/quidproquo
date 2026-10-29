import { actionResult, askEventMatchStoryBase, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { GLOBAL_KVS_STREAM_RUNTIME, MatchResult } from './types';

// One store, one handler, the runtime is stamped on the lambda by the CDK, so there is
// nothing to route on.
const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async ({ qpqEventRecord }) => {
    return actionResult<MatchResult>({
      runtime: GLOBAL_KVS_STREAM_RUNTIME,
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
