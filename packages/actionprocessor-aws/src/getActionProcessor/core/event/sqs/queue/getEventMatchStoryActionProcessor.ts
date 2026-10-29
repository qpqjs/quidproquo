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
import { InternalEventRecord, MatchResult } from './types';

// Only the queue name travels via the lambda environment; the full setting lives in the bundled
// qpqConfig (serializing it into env blows the lambda 4KB limit).
export const getQueueConfigSetting = (qpqConfig: QPQConfig, queueName: string): QueueQPQConfigSetting => {
  const queueQPQConfigSetting = qpqCoreUtils.getQueueByName(qpqConfig, queueName);

  if (!queueQPQConfigSetting) {
    throw new Error(`No queue config setting found for queue [${queueName}]`);
  }

  return queueQPQConfigSetting;
};

/** How a runtime learns which queue an event belongs to: the lambda knows from its environment, the dev server reads it off the message. */
export type ResolveQueueName = (eventParams: unknown[]) => string;

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
