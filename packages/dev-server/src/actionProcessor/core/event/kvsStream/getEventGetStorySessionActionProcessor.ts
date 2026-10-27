import { actionResult, askEventGetStorySessionBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { EventInput, InternalEventRecord, MatchResult } from './types';

const getProcessGetStorySession = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetStorySessionBase> => {
  return async () => actionResult(void 0);
};

export const getEventGetStorySessionActionProcessor = createActionProcessor(askEventGetStorySessionBase, getProcessGetStorySession);
