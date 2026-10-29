import { actionResult, askEventMatchStoryBase, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { GLOBAL_STORAGE_DRIVE_RUNTIME, MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async ({ qpqEventRecord }) => {
    return actionResult<MatchResult>({
      runtime: GLOBAL_STORAGE_DRIVE_RUNTIME,
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
