import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askEventBusSendMessagesBase,
  createActionProcessor,
  EventBusMessage,
  generateUuid,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  StorySession,
  toCrossServiceSession,
} from '@qpqjs/core';

import { publishMessage, SnsPublishMessageEntry } from '../../../logic/sns/publishMessage';

// TODO: @joe-coady: Unify this once the lambda code moves from CDK to awslambda
type AnyEventBusMessageWithSession = EventBusMessage<any> & {
  storySession: StorySession;
};

const getProcessEventBusSendMessage = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventBusSendMessagesBase> => {
  return async ({ eventBusName, eventBusMessages }, session) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const eventBusConfig = qpqCoreUtils.getEventBusByName(eventBusName, qpqConfig);

    if (!eventBusConfig) {
      return actionResultError(askEventBusSendMessagesBase.errorType.TopicNotFound, `Event bus ${eventBusName} not found`);
    }

    const topicArn = awsNamingUtils.getEventBusSnsTopicArnFromConfig(eventBusName, qpqConfig, eventBusConfig);

    // Each entry carries the caller's session so the consuming service resumes
    // with the same correlation/context.
    const toSnsEntry = (message: EventBusMessage<any>): SnsPublishMessageEntry => {
      const eventBusMessageWithSession: AnyEventBusMessageWithSession = {
        ...message,
        storySession: toCrossServiceSession(session),
      };

      return {
        message: JSON.stringify(eventBusMessageWithSession),

        // FIFO: default to one group per bus (global ordering) and a unique
        // dedup id (no dedup) - callers opt in to per-entity groups / real dedup
        ...(eventBusConfig.isFifo
          ? {
              groupId: message.groupId ?? eventBusName,
              deduplicationId: message.deduplicationId ?? generateUuid(),
            }
          : {}),
      };
    };

    try {
      await publishMessage(topicArn, region, eventBusMessages.map(toSnsEntry));

      return actionResult(undefined);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AuthorizationErrorException: () =>
          actionResultError(askEventBusSendMessagesBase.errorType.AccessDenied, 'Access denied publishing to event bus'),
        NotFoundException: () => actionResultError(askEventBusSendMessagesBase.errorType.TopicNotFound, `Event bus topic not found: ${eventBusName}`),
        InternalErrorException: () => actionResultError(askEventBusSendMessagesBase.errorType.Throttled, 'Event bus service unavailable'),
        ThrottledException: () => actionResultError(askEventBusSendMessagesBase.errorType.Throttled, 'Event bus throttled'),
      });
    }
  };
};

export const getEventBusSendMessagesActionProcessor = createActionProcessor(askEventBusSendMessagesBase, getProcessEventBusSendMessage);
