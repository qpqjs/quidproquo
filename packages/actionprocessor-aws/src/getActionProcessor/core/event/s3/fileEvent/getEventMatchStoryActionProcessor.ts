import { actionResult, askEventMatchStoryBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { EventInput, GLOBAL_STORAGE_DRIVE_RUNTIME, InternalEventRecord, MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async ({ qpqEventRecord }) => {
    return actionResult<MatchResult>({
      runtime: GLOBAL_STORAGE_DRIVE_RUNTIME,
    });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
