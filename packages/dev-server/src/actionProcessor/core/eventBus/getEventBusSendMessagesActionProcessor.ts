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

export type AnyEventBusMessageWithSession = QueueMessage<any> & {
  storySession: StorySession;

  eventBusName: string;

  targetApplication: string;
  targetEnvironment: string;
  targetModule: string;
  targetFeature?: string;
};

const getProcessEventBusSendMessage = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventBusSendMessagesBase> => {
  return async ({ eventBusName, eventBusMessages }, session) => {
    const eventBusConfig = qpqCoreUtils.getEventBusConfigByName(eventBusName, qpqConfig);
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

      const eventBusEvent: AnyEventBusMessageWithSession = {
        payload: eventBusMessage.payload,
        type: eventBusMessage.type,

        storySession: toCrossServiceSession(session),

        eventBusName: eventBusConfig.name,

        // FIFO: default to one group per bus (global ordering) - callers opt in to
        // per-entity groups via groupId on the message
        groupId: eventBusConfig.isFifo ? (eventBusMessage.groupId ?? eventBusName) : undefined,

        targetApplication: eventBusConfig.owner?.application || qpqCoreUtils.getApplicationName(qpqConfig),
        targetEnvironment: eventBusConfig.owner?.environment || qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
        targetFeature: eventBusConfig.owner?.feature || qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
        targetModule: qpqCoreUtils.resolveOwnerModuleName(eventBusConfig.owner, qpqConfig),
      };

      eventBus.publish(EventBusActionType.SendMessages, eventBusEvent);
    }

    return actionResult(undefined);
  };
};

export const getEventBusSendMessagesActionProcessor = createActionProcessor(askEventBusSendMessagesBase, getProcessEventBusSendMessage);
