import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askQueueSendMessagesBase,
  createActionProcessor,
  generateUuid,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  QueueActionType,
  QueueMessage,
  StorySession,
  toCrossServiceSession,
} from 'quidproquo-core';

import { getQueueRuntimeResourceNameFromConfig } from '../../../awsNamingUtils';
import { sendMessages, SqsQueueMessageEntry } from '../../../logic/sqs/sendMessages';

// TODO: Unify this once the lambda code moves from CDK to awslambda
type AnyQueueMessageWithSession = QueueMessage<any> & {
  storySession: StorySession;
};

const getProcessQueueSendMessage = (qpqConfig: QPQConfig): ProcessorFor<typeof askQueueSendMessagesBase> => {
  return async ({ queueName, queueMessages }, session) => {
    const sqsQueueName = getQueueRuntimeResourceNameFromConfig(queueName, qpqConfig);
    const isFifo = qpqCoreUtils.getQueueByName(qpqConfig, queueName)?.isFifo || false;

    // Each entry carries the caller's session so the consuming service resumes
    // with the same correlation/context.
    const toSqsEntry = (message: QueueMessage<any>): SqsQueueMessageEntry => {
      const queueMessageWithSession: AnyQueueMessageWithSession = {
        ...message,
        storySession: toCrossServiceSession(session),
      };

      return {
        body: JSON.stringify(queueMessageWithSession),

        // FIFO: default to one group per queue (global ordering) and a unique
        // dedup id (no dedup) - callers opt in to per-entity groups / real dedup
        ...(isFifo
          ? {
              groupId: message.groupId ?? queueName,
              deduplicationId: message.deduplicationId ?? generateUuid(),
            }
          : {}),
      };
    };

    try {
      await sendMessages(sqsQueueName, qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig), queueMessages.map(toSqsEntry));

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AccessDenied: () => actionResultError(askQueueSendMessagesBase.errorType.AccessDenied, 'Access denied sending to queue'),
        AccessDeniedException: () => actionResultError(askQueueSendMessagesBase.errorType.AccessDenied, 'Access denied sending to queue'),
        QueueDoesNotExist: () => actionResultError(askQueueSendMessagesBase.errorType.QueueNotFound, `Queue not found: ${queueName}`),
        RequestThrottled: () => actionResultError(askQueueSendMessagesBase.errorType.ServiceUnavailable, 'Queue throttled'),
      });
    }
  };
};

export const getQueueSendMessagesActionProcessor = createActionProcessor(askQueueSendMessagesBase, getProcessQueueSendMessage);
