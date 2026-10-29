import { actionResult, askEventGetStorySessionBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { EventInput, InternalEventRecord, MatchResult } from './types';

const getProcessGetStorySession = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetStorySessionBase> => {
  return async () => actionResult(undefined);
};

export const getEventGetStorySessionActionProcessor = createActionProcessor(askEventGetStorySessionBase, getProcessGetStorySession);
