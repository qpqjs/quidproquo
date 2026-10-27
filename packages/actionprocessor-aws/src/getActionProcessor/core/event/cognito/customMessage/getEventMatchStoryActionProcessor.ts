import {
  actionResult,
  actionResultError,
  askEventMatchStoryBase,
  createActionProcessor,
  ErrorTypeEnum,
  EventActionType,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from 'quidproquo-core';
import { EmailSendEventType } from 'quidproquo-webserver';

import { EventInput, InternalEventRecord, MatchResult } from './types';

// TODO: Don't use Globals like this
const GLOBAL_USER_DIRECTORY_NAME = process.env.userDirectoryName!;

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  const userDirectoryConfig = qpqCoreUtils.getUserDirectories(qpqConfig).find((ud) => ud.name === GLOBAL_USER_DIRECTORY_NAME);

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
