import {
  actionResult,
  askEventTransformResponseResultBase,
  createActionProcessor,
  EitherActionResult,
  EventActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { EventInput, EventOutput, InternalEventOutput } from './types';

const getProcessTransformResponseResult = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventTransformResponseResultBase> => {
  // We might need to JSON.stringify the body.
  return async ({ eventParams: rawEventParams, qpqEventRecordResponses: rawQpqEventRecordResponses }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const eventParams = rawEventParams as EventInput;
    const qpqEventRecordResponses = rawQpqEventRecordResponses as EitherActionResult<InternalEventOutput>[];

    const [customMessageTriggerEvent] = eventParams;
    const [emailSendEventResponse] = qpqEventRecordResponses;

    if (emailSendEventResponse.success) {
      const updatedEvent: EventOutput = {
        ...customMessageTriggerEvent,
        response: {
          ...customMessageTriggerEvent.response,
          emailMessage: emailSendEventResponse.result.body,
          emailSubject: emailSendEventResponse.result.subject,
        },
      };

      return actionResult<EventOutput>(updatedEvent);
    }

    // Just let cognito handle the event
    return actionResult<EventOutput>(customMessageTriggerEvent);
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
