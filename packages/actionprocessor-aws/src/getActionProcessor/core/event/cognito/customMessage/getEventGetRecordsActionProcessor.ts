import { actionResult, askEventGetRecordsBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { EmailSendEventType } from 'quidproquo-webserver';

import { EventInput, InternalEventRecord } from './types';

const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [customMessageTriggerEvent, context] = eventParams as EventInput;

    const internalEventRecord: InternalEventRecord = {
      eventType: EmailSendEventType.VerifyEmail,

      code: customMessageTriggerEvent.request.codeParameter,
      link: customMessageTriggerEvent.request.linkParameter,
      attributes: customMessageTriggerEvent.request.userAttributes,
      username: customMessageTriggerEvent.request.usernameParameter,
    };

    switch (customMessageTriggerEvent.triggerSource) {
      case 'CustomMessage_ForgotPassword': {
        if (customMessageTriggerEvent.request.clientMetadata?.['userInitiated'] === 'true') {
          internalEventRecord.eventType = EmailSendEventType.ResetPassword;
        } else {
          internalEventRecord.eventType = EmailSendEventType.ResetPasswordAdmin;
        }
        break;
      }

      case 'CustomMessage_VerifyUserAttribute':
        internalEventRecord.eventType = EmailSendEventType.VerifyEmail;
        break;
    }

    return actionResult([internalEventRecord]);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
