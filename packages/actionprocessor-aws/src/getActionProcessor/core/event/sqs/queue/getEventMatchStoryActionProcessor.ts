import {
  actionResult,
  actionResultError,
  askEventMatchStoryBase,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  QueueQPQConfigSetting,
} from '@qpqjs/core';

import { matchUrl } from '../../../../../awsLambdaUtils';
import { InternalEventRecord, MatchResult, ResolveQueueName } from './types';
import { getQueueConfigSetting } from './utils';

const getProcessMatchStory = (qpqConfig: QPQConfig, resolveQueueName: ResolveQueueName): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async ({ qpqEventRecord: rawQpqEventRecord, eventParams }) => {
    const queueQPQConfigSetting = getQueueConfigSetting(qpqConfig, resolveQueueName(eventParams));
    const queueQueueProcessors = queueQPQConfigSetting.qpqQueueProcessors;
    const queueTypes = Object.keys(queueQueueProcessors).sort();

    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;

    // Find the most relevant match
    const matchedQueueType = queueTypes
      .map((qt) => ({
        match: matchUrl(qt, qpqEventRecord.message.type),
        queueType: qt,
      }))
      .find((m) => m.match.didMatch);

    if (!matchedQueueType) {
      // If we have event bus subscriptions then we don't want to error if we can't match
      // early exit will just exit gracefully
      if (queueQPQConfigSetting.eventBusSubscriptions.length > 0) {
        return actionResult<MatchResult>({});
      }

      return actionResultError(ErrorTypeEnum.NotFound, `queue type not found ${qpqEventRecord.message.type}`);
    }

    const sourceEntry = queueQueueProcessors[matchedQueueType.queueType];

    return actionResult<MatchResult>({
      runtime: sourceEntry,
      runtimeOptions: matchedQueueType.match.params || {},
      config: matchedQueueType.queueType,
    });
  };
};

/** Shared by the lambda and the dev server (B6); each passes how it resolves the queue name. */
export const getEventMatchStoryActionProcessor = (resolveQueueName: ResolveQueueName) =>
  createActionProcessor(askEventMatchStoryBase, (qpqConfig) => getProcessMatchStory(qpqConfig, resolveQueueName));
