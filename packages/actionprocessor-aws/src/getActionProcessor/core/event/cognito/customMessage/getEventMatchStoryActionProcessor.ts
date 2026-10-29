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

const GLOBAL_USER_DIRECTORY_NAME = process.env.userDirectoryName!;

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  const userDirectoryConfig = qpqCoreUtils.getUserDirectoryByName(GLOBAL_USER_DIRECTORY_NAME, qpqConfig);

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

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
