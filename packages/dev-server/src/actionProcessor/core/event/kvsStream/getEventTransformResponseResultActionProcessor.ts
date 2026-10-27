import { actionResult, askEventTransformResponseResultBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { EventInput, EventOutput, InternalEventOutput } from './types';

const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  return async () => actionResult<EventOutput>(void 0);
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
