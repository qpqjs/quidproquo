import { actionResult, askEventAutoRespondBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { InternalEventOutput, InternalEventRecord, MatchResult } from './types';

const getProcessAutoRespond = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventAutoRespondBase> => {
  return async ({ qpqEventRecord, matchResult }) => {
    return actionResult(null);
  };
};

export const getEventAutoRespondActionProcessor = createActionProcessor(askEventAutoRespondBase, getProcessAutoRespond);
