import {
  actionResult,
  actionResultError,
  askEventTransformResponseResultBase,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { EventOutput } from './types';

const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  // We might need to JSON.stringify the body.
  return async ({ eventParams, qpqEventRecordResponses }) => {
    const [record] = qpqEventRecordResponses;
    if (!record) {
      return actionResultError(ErrorTypeEnum.GenericError, 'Expected one event record response');
    }

    // Just return the either result back, let the caller deal with it.
    return actionResult<EventOutput>(record);
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
