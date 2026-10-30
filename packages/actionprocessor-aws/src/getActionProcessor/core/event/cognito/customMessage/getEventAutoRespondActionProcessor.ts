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

import { InternalEventRecord } from './types';

const getProcessAutoRespond = (qpqConfig: QPQConfig, userDirectoryName: string): ProcessorFor<typeof askEventAutoRespondBase> => {
  const userDirectoryConfig = qpqCoreUtils.getUserDirectoryByName(userDirectoryName, qpqConfig);

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

/** The user directory the lambda serves comes from the handler, which reads it from the lambda environment once. */
export const getEventAutoRespondActionProcessor = (userDirectoryName: string) =>
  createActionProcessor(askEventAutoRespondBase, (qpqConfig) => getProcessAutoRespond(qpqConfig, userDirectoryName));
