import { actionResult, askEventMatchStoryBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { EventInput, GLOBAL_KVS_STREAM_RUNTIME, InternalEventRecord, MatchResult } from './types';

// One store, one handler — the runtime is stamped on the lambda by the CDK, so there is
// nothing to route on.
const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async ({ qpqEventRecord }) => {
    return actionResult<MatchResult>({
      runtime: GLOBAL_KVS_STREAM_RUNTIME,
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
