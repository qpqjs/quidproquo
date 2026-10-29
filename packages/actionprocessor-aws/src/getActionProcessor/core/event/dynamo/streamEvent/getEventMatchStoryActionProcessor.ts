import { actionResult, askEventMatchStoryBase, createActionProcessor, ProcessorFor, QpqFunctionRuntime } from '@qpqjs/core';

import { MatchResult } from './types';

// One store, one handler, the runtime is stamped on the lambda by the CDK, so there is
// nothing to route on.
const getProcessMatchStory = (runtime: QpqFunctionRuntime): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async () => actionResult<MatchResult>({ runtime });
};

/** The handler the lambda runs comes from the handler module, which reads it from the lambda environment once. */
export const getEventMatchStoryActionProcessor = (runtime: QpqFunctionRuntime) =>
  createActionProcessor(askEventMatchStoryBase, () => getProcessMatchStory(runtime));
