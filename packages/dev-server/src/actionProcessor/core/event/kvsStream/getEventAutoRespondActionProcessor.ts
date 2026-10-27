import { actionResult, askEventAutoRespondBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { InternalEventOutput, InternalEventRecord, MatchResult } from './types';

const getProcessAutoRespond = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventAutoRespondBase> => {
  return async () => actionResult(null);
};

export const getEventAutoRespondActionProcessor = createActionProcessor(askEventAutoRespondBase, getProcessAutoRespond);
