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
  return async ({ eventParams, qpqEventRecordResponses }) => {
    const [record] = qpqEventRecordResponses;
    if (!record) {
      return actionResultError(ErrorTypeEnum.GenericError, 'Expected one event record response');
    }

    // Throw back to caller if the logic errors..
    if (!record.success) {
      return actionResultError(record.error.errorType, record.error.errorText, record.error.errorStack);
    }

    // Transform back to api gateway
    return actionResult<EventOutput>(void 0);
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
