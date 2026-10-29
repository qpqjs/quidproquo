import {
  actionResult,
  actionResultError,
  askEventTransformResponseResultBase,
  createActionProcessor,
  EitherActionResult,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { EventOutput, InternalEventOutput } from './types';

const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  // We might need to JSON.stringify the body.
  return async ({ eventParams: rawEventParams, qpqEventRecordResponses: rawQpqEventRecordResponses }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const qpqEventRecordResponses = rawQpqEventRecordResponses as EitherActionResult<InternalEventOutput>[];

    const [record] = qpqEventRecordResponses;

    if (!record) {
      return actionResultError(ErrorTypeEnum.GenericError, 'Expected one event record response');
    }

    if (record.success) {
      // Just return the either result back, let the caller deal with it.
      return actionResult<EventOutput>(record.result);
    }

    return actionResultError(record.error.errorType, record.error.errorText, record.error.errorStack);
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
