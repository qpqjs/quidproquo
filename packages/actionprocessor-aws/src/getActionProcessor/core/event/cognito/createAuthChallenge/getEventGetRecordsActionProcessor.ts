import { actionResult, askEventGetRecordsBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { getQpqAttributesFromCognitoStringMap } from '../../../../../logic/cognito/getQpqAttributesFromCognitoStringMap';
import { getChallengeSessionFromCognitoTriggerEventSession } from '../utils';
import { EventInput, InternalEventRecord } from './types';

const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [event, context] = eventParams as EventInput;

    const internalEventRecord: InternalEventRecord = {
      userName: event.userName,
      session: getChallengeSessionFromCognitoTriggerEventSession(event.request.session),
      userAttributes: getQpqAttributesFromCognitoStringMap(event.request.userAttributes),
    };

    return actionResult([internalEventRecord]);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
