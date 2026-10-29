import {
  actionResult,
  actionResultError,
  askQueueSendMessagesBase,
  createActionProcessor,
  generateUuid,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  QueueActionType,
  toCrossServiceSession,
} from '@qpqjs/core';

import { eventBus } from '../../../logic/eventBus';
import { isDuplicateFifoMessage } from '../../../logic/fifoDeduplication';
import { AnyQueueMessageWithSession } from '../event/queue/types';

const getProcessQueueSendMessage = (qpqConfig: QPQConfig): ProcessorFor<typeof askQueueSendMessagesBase> => {
  return async ({ queueName, queueMessages }, session) => {
    const queueConfig = qpqCoreUtils.getQueueByName(qpqConfig, queueName);
    if (!queueConfig) {
      return actionResultError(askQueueSendMessagesBase.errorType.QueueNotFound, `Queue ${queueName} not found`);
    }

    for (const queueMessage of queueMessages) {
      if (queueConfig.isFifo) {
        const deduplicationId = queueMessage.deduplicationId ?? generateUuid();

        if (isDuplicateFifoMessage(`${queueName}:${deduplicationId}`)) {
          continue;
        }
      }

      const queueEvent: AnyQueueMessageWithSession = {
        payload: queueMessage.payload,
        type: queueMessage.type,

        storySession: toCrossServiceSession(session),

        messageId: generateUuid(),
        queueName: queueName,

        // FIFO: default to one group per queue (global ordering) - callers opt in to
        // per-entity groups via groupId on the message
        groupId: queueConfig.isFifo ? (queueMessage.groupId ?? queueName) : undefined,

        targetApplication: queueConfig.owner?.application || qpqCoreUtils.getApplicationName(qpqConfig),
        targetEnvironment: queueConfig.owner?.environment || qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
        targetFeature: queueConfig.owner?.feature || qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
        targetModule: qpqCoreUtils.resolveOwnerModuleName(queueConfig.owner, qpqConfig),
      };

      eventBus.publish(QueueActionType.SendMessages, queueEvent);
    }

    return actionResult(undefined);
  };
};

export const getQueueSendMessagesActionProcessor = createActionProcessor(askQueueSendMessagesBase, getProcessQueueSendMessage);
