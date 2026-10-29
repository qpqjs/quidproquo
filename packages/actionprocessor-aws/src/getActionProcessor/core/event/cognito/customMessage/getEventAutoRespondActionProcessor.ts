import {
  actionResult,
  actionResultError,
  askEventAutoRespondBase,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from '@qpqjs/core';
import { EmailSendEventType } from '@qpqjs/webserver';

import { GLOBAL_USER_DIRECTORY_NAME, InternalEventRecord } from './types';

const getProcessAutoRespond = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventAutoRespondBase> => {
  const userDirectoryConfig = qpqCoreUtils.getUserDirectoryByName(GLOBAL_USER_DIRECTORY_NAME, qpqConfig);

  return async ({ qpqEventRecord: rawQpqEventRecord }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;

    const getErrorResult = () => actionResultError(ErrorTypeEnum.NotFound, `Email lambda not implemented for ${qpqEventRecord.eventType}`);

    switch (qpqEventRecord.eventType) {
      case EmailSendEventType.ResetPassword:
        if (!userDirectoryConfig?.emailTemplates.resetPassword) {
          return getErrorResult();
        }
        break;

      case EmailSendEventType.ResetPasswordAdmin:
        if (!userDirectoryConfig?.emailTemplates.resetPasswordAdmin) {
          return getErrorResult();
        }
        break;

      case EmailSendEventType.VerifyEmail:
        if (!userDirectoryConfig?.emailTemplates.verifyEmail) {
          return getErrorResult();
        }
        break;

      default:
        return actionResultError(ErrorTypeEnum.NotFound, `Email processor not implemented for ${qpqEventRecord.eventType}`);
    }

    return actionResult(null);
  };
};

export const getEventAutoRespondActionProcessor = createActionProcessor(askEventAutoRespondBase, getProcessAutoRespond);
