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

const getProcessMatchStory = (qpqConfig: QPQConfig, queueName: string): ProcessorFor<typeof askEventMatchStoryBase> => {
  const queueQPQConfigSetting = getQueueConfigSetting(qpqConfig, queueName);
  const queueQueueProcessors = queueQPQConfigSetting.qpqQueueProcessors;
  const queueTypes = Object.keys(queueQueueProcessors).sort();

  return async ({ qpqEventRecord: rawQpqEventRecord }) => {
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

/** The queue the lambda drains comes from the handler, which reads it from the lambda environment once. */
export const getEventMatchStoryActionProcessor = (queueName: string) =>
  createActionProcessor(askEventMatchStoryBase, (qpqConfig) => getProcessMatchStory(qpqConfig, queueName));
