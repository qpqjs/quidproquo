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
  QueueQPQConfigSetting,
} from 'quidproquo-core';

import { matchUrl } from '../../../../../awsLambdaUtils';
import { EventInput, InternalEventRecord, MatchResult } from './types';

export const getQueueConfigSetting = (qpqConfig: QPQConfig): QueueQPQConfigSetting => {
  // Only the queue name travels via the environment - the full setting lives in
  // the bundled qpqConfig (serializing it into env blows the lambda 4KB limit).
  const queueName = process.env.queueName as string;
  const queueQPQConfigSetting = qpqCoreUtils.getQueueConfigSettingByName(queueName, qpqConfig);

  if (!queueQPQConfigSetting) {
    throw new Error(`No queue config setting found for queue [${queueName}]`);
  }

  return queueQPQConfigSetting;
};

const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  const queueQPQConfigSetting = getQueueConfigSetting(qpqConfig);
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

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
