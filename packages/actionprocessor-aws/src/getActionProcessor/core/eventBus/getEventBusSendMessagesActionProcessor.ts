import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askEventBusSendMessagesBase,
  createActionProcessor,
  ErrorTypeEnum,
  EventBusActionType,
  EventBusMessage,
  generateUuid,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  StorySession,
  toCrossServiceSession,
} from 'quidproquo-core';

import { getEventBusSnsTopicArn } from '../../../awsNamingUtils';
import { publishMessage, SnsPublishMessageEntry } from '../../../logic/sns/publishMessage';

// TODO: Unify this once the lambda code moves from CDK to awslambda
type AnyEventBusMessageWithSession = EventBusMessage<any> & {
  storySession: StorySession;
};

const getProcessEventBusSendMessage = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventBusSendMessagesBase> => {
  return async ({ eventBusName, eventBusMessages }, session) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const eventBusConfig = qpqCoreUtils.getEventBusConfigByName(eventBusName, qpqConfig);

    if (!eventBusConfig) {
      return actionResultError(ErrorTypeEnum.NotFound, `Event bus ${eventBusName} not found`);
    }

    const topicArn = getEventBusSnsTopicArn(
      eventBusConfig.owner?.resourceNameOverride || eventBusName,
      qpqConfig,

      eventBusConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig),
      eventBusConfig.owner?.environment || qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
      eventBusConfig.owner?.application || qpqCoreUtils.getApplicationName(qpqConfig),
      eventBusConfig.owner?.feature || qpqCoreUtils.getApplicationModuleFeature(qpqConfig),

      eventBusConfig.isFifo,
    );

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

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        AuthorizationErrorException: () =>
          actionResultError(askEventBusSendMessagesBase.errorType.AccessDenied, 'Access denied publishing to event bus'),
        NotFoundException: () => actionResultError(askEventBusSendMessagesBase.errorType.TopicNotFound, `Event bus topic not found: ${eventBusName}`),
        InternalErrorException: () => actionResultError(askEventBusSendMessagesBase.errorType.ServiceUnavailable, 'Event bus service unavailable'),
        ThrottledException: () => actionResultError(askEventBusSendMessagesBase.errorType.ServiceUnavailable, 'Event bus throttled'),
      });
    }
  };
};

export const getEventBusSendMessagesActionProcessor = createActionProcessor(askEventBusSendMessagesBase, getProcessEventBusSendMessage);
