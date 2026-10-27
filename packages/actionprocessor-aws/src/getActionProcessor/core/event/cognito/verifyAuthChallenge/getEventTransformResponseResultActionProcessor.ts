import {
  actionResult,
  askEventTransformResponseResultBase,
  createActionProcessor,
  EitherActionResult,
  EventActionType,
  ProcessorFor,
  QPQConfig,
  QPQError,
} from 'quidproquo-core';

import { EventInput, EventOutput, InternalEventOutput } from './types';

const getResponseFromErrorResult = (error: QPQError): InternalEventOutput => {
  return {
    answerCorrect: false,
  };
};

const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  // We might need to JSON.stringify the body.
  return async ({ eventParams: rawEventParams, qpqEventRecordResponses: rawQpqEventRecordResponses }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const eventParams = rawEventParams as EventInput;
    const qpqEventRecordResponses = rawQpqEventRecordResponses as EitherActionResult<InternalEventOutput>[];

    const [customMessageTriggerEvent] = eventParams;
    const [qpqEventRecordResponse] = qpqEventRecordResponses;

    // If we have an error, we need to transform it to a response, otherwise we can just use the record as is
    let successRecord = qpqEventRecordResponse.success ? qpqEventRecordResponse.result : getResponseFromErrorResult(qpqEventRecordResponse.error);

    const eventOutput: EventOutput = {
      ...customMessageTriggerEvent,
      response: {
        ...customMessageTriggerEvent.response,

        answerCorrect: successRecord.answerCorrect,
      },
    };

    return actionResult<EventOutput>(eventOutput);
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
