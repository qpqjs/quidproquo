import {
  actionResult,
  actionResultError,
  askEventTransformResponseResultBase,
  createActionProcessor,
  EventActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { EventInput, EventOutput, InternalEventOutput } from './types';

const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  // We might need to JSON.stringify the body.
  return async ({ eventParams, qpqEventRecordResponses }) => {
    const [record] = qpqEventRecordResponses;

    // Just return the either result back, let the caller deal with it.
    return actionResult<EventOutput>(record);
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
