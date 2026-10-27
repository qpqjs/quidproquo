import { actionResult, askEventAutoRespondBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { InternalEventOutput, InternalEventRecord, MatchResult } from './types';

const getProcessAutoRespond = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventAutoRespondBase> => {
  return async ({ matchResult }) => {
    // If we could not match, we can just auto respond...
    if (!matchResult.runtime) {
      // Just say we have finished gracefully.
      return actionResult(true);
    }

    return actionResult(null);
  };
};

export const getEventAutoRespondActionProcessor = createActionProcessor(askEventAutoRespondBase, getProcessAutoRespond);
