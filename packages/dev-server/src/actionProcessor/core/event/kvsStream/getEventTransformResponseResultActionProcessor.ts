import { actionResult, askEventTransformResponseResultBase, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { EventOutput } from './types';

const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  return async () => actionResult<EventOutput>(void 0);
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
