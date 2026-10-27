import {
  actionResult,
  actionResultError,
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
    const [qpqEventRecordResponse] = qpqEventRecordResponses;

    // If the runtime failed for some reason, just return this out as a fail
    if (!qpqEventRecordResponse.success) {
      return actionResultError(
        qpqEventRecordResponse.error.errorType,
        qpqEventRecordResponse.error.errorText,
        qpqEventRecordResponse.error.errorStack,
      );
    }

    // No error has happened
    let successRecord = qpqEventRecordResponse.result;

    const eventOutput: EventOutput = {
      ...customMessageTriggerEvent,
      response: {
        ...customMessageTriggerEvent.response,
      },
    };

    // challengeMetadata / publicChallengeParameters / challengeMetadata can all be null.
    if (successRecord.challengeName) {
      eventOutput.response.challengeMetadata = successRecord.challengeName;
    }

    if (successRecord.privateChallengeParameters) {
      eventOutput.response.privateChallengeParameters = successRecord.privateChallengeParameters;
    }

    if (successRecord.publicChallengeParameters) {
      eventOutput.response.publicChallengeParameters = successRecord.publicChallengeParameters;
    }

    return actionResult<EventOutput>(eventOutput);
  };
};

export const getEventTransformResponseResultActionProcessor = createActionProcessor(
  askEventTransformResponseResultBase,
  getProcessTransformResponseResult,
);
