import {
  actionResult,
  actionResultError,
  askEventMatchStoryBase,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from '@qpqjs/core';
import { EmailSendEventType } from '@qpqjs/webserver';

import { InternalEventRecord, MatchResult } from './types';

const getProcessMatchStory = (qpqConfig: QPQConfig, userDirectoryName: string): ProcessorFor<typeof askEventMatchStoryBase> => {
  const userDirectoryConfig = qpqCoreUtils.getUserDirectoryByName(userDirectoryName, qpqConfig);

  return async ({ qpqEventRecord: rawQpqEventRecord }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;

    switch (qpqEventRecord.eventType) {
      case EmailSendEventType.ResetPassword:
        return actionResult<MatchResult>({
          runtime: userDirectoryConfig?.emailTemplates.resetPassword,
        });
      case EmailSendEventType.ResetPasswordAdmin:
        return actionResult<MatchResult>({
          runtime: userDirectoryConfig?.emailTemplates.resetPasswordAdmin,
        });
      case EmailSendEventType.VerifyEmail:
        return actionResult<MatchResult>({
          runtime: userDirectoryConfig?.emailTemplates.verifyEmail,
        });
      default:
        return actionResultError(ErrorTypeEnum.NotFound, `Email lambda not implemented for ${qpqEventRecord.eventType}`);
    }
  };
};

/** The user directory the lambda serves comes from the handler, which reads it from the lambda environment once. */
export const getEventMatchStoryActionProcessor = (userDirectoryName: string) =>
  createActionProcessor(askEventMatchStoryBase, (qpqConfig) => getProcessMatchStory(qpqConfig, userDirectoryName));
