import { actionResult, askEventMatchStoryBase, createActionProcessor, ProcessorFor, QpqFunctionRuntime } from '@qpqjs/core';

import { MatchResult } from './types';

// One drive, one handler, stamped on the lambda by the CDK: there is nothing to route on.
const getProcessMatchStory = (storageDriveRuntime: QpqFunctionRuntime): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async () => actionResult<MatchResult>({ runtime: storageDriveRuntime });
};

/** The handler the lambda runs comes from the handler module, which reads it from the lambda environment once. */
export const getEventMatchStoryActionProcessor = (storageDriveRuntime: QpqFunctionRuntime) =>
  createActionProcessor(askEventMatchStoryBase, () => getProcessMatchStory(storageDriveRuntime));
