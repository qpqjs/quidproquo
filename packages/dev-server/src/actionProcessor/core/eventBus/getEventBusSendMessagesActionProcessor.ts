import {
  actionResult,
  actionResultError,
  askEventBusSendMessagesBase,
  createActionProcessor,
  EventBusActionType,
  generateUuid,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  QueueMessage,
  StorySession,
  toCrossServiceSession,
} from '@qpqjs/core';

import { eventBus } from '../../../logic/eventBus';
import { isDuplicateFifoMessage } from '../../../logic/fifoDeduplication';
import { AnyEventBusMessageWithSession } from './types';

const getProcessEventBusSendMessage = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventBusSendMessagesBase> => {
  return async ({ eventBusName, eventBusMessages }, session) => {
    const eventBusConfig = qpqCoreUtils.getEventBusByName(eventBusName, qpqConfig);
    if (!eventBusConfig) {
      return actionResultError(
        askEventBusSendMessagesBase.errorType.TopicNotFound,
        `Event bus ${eventBusName} not found for service [${qpqCoreUtils.getApplicationModuleName(qpqConfig)}]`,
      );
    }

    for (const eventBusMessage of eventBusMessages) {
      if (eventBusConfig.isFifo) {
        const deduplicationId = eventBusMessage.deduplicationId ?? generateUuid();

        if (isDuplicateFifoMessage(`${eventBusName}:${deduplicationId}`)) {
          continue;
        }
      }

      const target = qpqCoreUtils.resolveOwnerDeploymentContext(qpqConfig, eventBusConfig.owner);

      const eventBusEvent: AnyEventBusMessageWithSession = {
        payload: eventBusMessage.payload,
        type: eventBusMessage.type,

        storySession: toCrossServiceSession(session),

        eventBusName: eventBusConfig.name,

        // FIFO: default to one group per bus (global ordering) - callers opt in to
        // per-entity groups via groupId on the message
        groupId: eventBusConfig.isFifo ? (eventBusMessage.groupId ?? eventBusName) : undefined,

        targetApplication: target.application,
        targetEnvironment: target.environment,
        targetFeature: target.feature,
        targetModule: target.module,
      };

      eventBus.publish(EventBusActionType.SendMessage, eventBusEvent);
    }

    return actionResult(undefined);
  };
};

export const getEventBusSendMessagesActionProcessor = createActionProcessor(askEventBusSendMessagesBase, getProcessEventBusSendMessage);
