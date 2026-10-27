import { actionResult, askEventGetRecordsBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { getQpqAttributesFromCognitoStringMap } from '../../../../../logic/cognito/getQpqAttributesFromCognitoStringMap';
import { EventInput, InternalEventRecord } from './types';

const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [event, context] = eventParams as EventInput;

    const internalEventRecord: InternalEventRecord = {
      challengeAnswer: event.request.challengeAnswer ? JSON.parse(event.request.challengeAnswer) : {},
      userAttributes: getQpqAttributesFromCognitoStringMap(event.request.userAttributes),
      userNotFound: event.request.userNotFound,
      privateChallengeParameters: event.request.privateChallengeParameters,
    };

    return actionResult([internalEventRecord]);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
