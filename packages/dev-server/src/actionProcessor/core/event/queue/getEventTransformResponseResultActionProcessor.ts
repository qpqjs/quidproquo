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

// One message per delivery, so a failed story is passed through as the event's failure. The queue
// implementation then redelivers it up to maxTries, the way SQS redelivers a record a lambda reports
// in batchItemFailures; answering success here would mean a failing story is never retried locally.
const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  return async ({ qpqEventRecordResponses }) => {
    const [record] = qpqEventRecordResponses;
    if (!record) {
      return actionResultError(ErrorTypeEnum.GenericError, 'Expected one queue record response');
    }

    if (!record.success) {
      return actionResultError(record.error.errorType, record.error.errorText, record.error.errorStack);
    }

    return actionResult<EventOutput>(undefined);
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
