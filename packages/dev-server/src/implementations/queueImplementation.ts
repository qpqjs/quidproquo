import {
  EventBusActionType,
  generateUuid,
  Nullable,
  QPQConfig,
  qpqCoreUtils,
  QpqFunctionRuntime,
  QpqRuntimeType,
  QueueActionType,
  QueueQPQConfigSetting,
  StoryResult,
} from '@qpqjs/core';

import { getQueueEventProcessor } from '../actionProcessor/core/event/queue';
import { AnyQueueMessageWithSession } from '../actionProcessor/core/event/queue/types';
import { AnyEventBusMessageWithSession } from '../actionProcessor/core/eventBus/types';
import { ConcurrencyGate, createConcurrencyGate, eventBus, processEvent, sleep, trackInFlight } from '../logic';
import { DevServerPluginStop } from '../plugins/types/DevServerPluginStop';
import { ResolvedDevServerConfig } from '../types';

// A retry waits ttRetryInSeconds on AWS (the visibility timeout). Locally the same wait is kept
// but capped, so a queue declared with the 15 minute default does not stall a dev session.
const LOCAL_MAX_RETRY_DELAY_MS = 5_000;

// The queue setting for a message, looked up in the config of the service it targets.
const resolveQueueConfig = (qpqConfigs: QPQConfig[], payload: AnyQueueMessageWithSession): Nullable<QueueQPQConfigSetting> => {
  const targetConfig = qpqConfigs.find((qpqConfig) => qpqCoreUtils.getApplicationModuleName(qpqConfig) === payload.targetModule);

  return targetConfig ? qpqCoreUtils.getQueueByName(payload.queueName, targetConfig) : null;
};

const resolveQueueConcurrencyLimit = (qpqConfigs: QPQConfig[], payload: AnyQueueMessageWithSession): number | undefined => {
  const limit = resolveQueueConfig(qpqConfigs, payload)?.maxConcurrentExecutions;

  return typeof limit === 'number' && limit > 0 ? limit : undefined;
};

const getDynamicModuleLoader = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig) => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  return async (runtime: QpqFunctionRuntime): Promise<any> => devServerConfig.dynamicModuleLoader(serviceName, runtime);
};

// Runs the message through this service when the message targets it; null when it does not.
const processQueueMessages = async (
  qpqConfig: QPQConfig,
  payload: AnyQueueMessageWithSession,
  devServerConfig: ResolvedDevServerConfig,
): Promise<Nullable<StoryResult<[AnyQueueMessageWithSession], any>>> => {
  if (payload.targetEnvironment !== qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig)) {
    return null;
  }

  if (payload.targetApplication !== qpqCoreUtils.getApplicationName(qpqConfig)) {
    return null;
  }

  if (payload.targetModule !== qpqCoreUtils.getApplicationModuleName(qpqConfig)) {
    return null;
  }

  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);
  if ((!!payload.targetFeature || !!feature) && payload.targetFeature !== feature) {
    return null;
  }

  return processEvent<AnyQueueMessageWithSession, any>(
    payload,
    qpqConfig,
    getDynamicModuleLoader(qpqConfig, devServerConfig),
    getQueueEventProcessor,
    QpqRuntimeType.QUEUE_EVENT,
    (e: AnyQueueMessageWithSession) => e.storySession,
    devServerConfig,
  );
};

const processQueueEventBusSubscriptions = async (qpqConfig: QPQConfig, ebMessage: AnyEventBusMessageWithSession) => {
  const allEventBuses = qpqCoreUtils.getAllEventBusConfigs(qpqConfig).filter((ebc) => {
    const source = qpqCoreUtils.resolveOwnerDeploymentContext(qpqConfig, ebc.owner);

    return (
      source.application === ebMessage.targetApplication &&
      source.environment === ebMessage.targetEnvironment &&
      source.module === ebMessage.targetModule &&
      ((!source.feature && !ebMessage.targetFeature) || source.feature === ebMessage.targetFeature)
    );
  });
  // The queues this service owns (getOwnedQueueConfigs already keeps only those) that
  // subscribe to the message's bus, where that bus is one of the matching ones above.
  const queues = qpqCoreUtils
    .getOwnedQueueConfigs(qpqConfig)
    .filter((q) => q.eventBusSubscriptions.some((subscription) => allEventBuses.some((eb) => subscription === eb.name)))
    .filter((q) => q.eventBusSubscriptions.includes(ebMessage.eventBusName));

  for (const queue of queues) {
    const target = qpqCoreUtils.resolveOwnerDeploymentContext(qpqConfig, queue.owner);

    const queueMessage: AnyQueueMessageWithSession = {
      payload: ebMessage.payload,
      type: ebMessage.type,

      storySession: ebMessage.storySession,

      queueName: queue.name,

      // FIFO: carry the bus message's group through to the queue, like SNS FIFO -> SQS FIFO
      groupId: queue.isFifo ? ebMessage.groupId : undefined,

      targetApplication: target.application,
      targetEnvironment: target.environment,
      targetFeature: target.feature,
      targetModule: target.module,

      messageId: generateUuid(),
    };

    eventBus.publish(QueueActionType.SendMessages, queueMessage);
  }
};

export const queueImplementation = async (devServerConfig: ResolvedDevServerConfig): Promise<Nullable<DevServerPluginStop>> => {
  // Fail fast when a FIFO queue subscribes to a standard bus (AWS can't deliver those)
  for (const qpqConfig of devServerConfig.qpqConfigs) {
    qpqCoreUtils.assertFifoQueueEventBusSubscriptionsAreValid(qpqConfig);
  }

  // FIFO simulation: messages with a groupId are chained onto a per-group promise tail so
  // they process strictly one at a time, in send order - like SQS FIFO message groups.
  // There is no local redelivery/DLQ, so a failed message just logs and the group moves on.
  const fifoGroupTails: Map<string, Promise<void>> = new Map();

  // Per-queue concurrency: AWS caps a queue's consumer at maxConcurrentExecutions (migrations
  // rely on 1 to run serially), so the same cap is applied here.
  const queueGates: Map<string, ConcurrencyGate> = new Map();
  const getQueueGate = (payload: AnyQueueMessageWithSession): ConcurrencyGate | undefined => {
    const limit = resolveQueueConcurrencyLimit(devServerConfig.qpqConfigs, payload);
    if (limit === undefined) {
      return undefined;
    }

    const gateKey = `${payload.targetModule}:${payload.queueName}`;
    const existing = queueGates.get(gateKey);
    if (existing) {
      return existing;
    }

    const gate = createConcurrencyGate(limit);
    queueGates.set(gateKey, gate);
    return gate;
  };

  eventBus.on(QueueActionType.SendMessages, async (payload: AnyQueueMessageWithSession, correlation: string) => {
    // One delivery: the first failure (a thrown error or a failed story) is what a retry answers.
    const processOnce = async (): Promise<Nullable<unknown>> => {
      try {
        for (const qpqConfig of devServerConfig.qpqConfigs) {
          const result = await processQueueMessages(qpqConfig, payload, devServerConfig);
          if (result?.error) {
            return result.error.errorText;
          }
        }
      } catch (error) {
        return error;
      }

      return null;
    };

    // Redelivery as AWS does it: up to maxTries, waiting ttRetryInSeconds between tries. There is
    // no local dead-letter queue, so the last failure is logged and the message dropped.
    const processAllUngated = async () => {
      const queueConfig = resolveQueueConfig(devServerConfig.qpqConfigs, payload);
      const maxTries = Math.max(1, queueConfig?.maxTries ?? 1);
      const retryDelayMs = Math.min((queueConfig?.ttRetryInSeconds ?? 0) * 1000, LOCAL_MAX_RETRY_DELAY_MS);
      const label = `Queue [${payload.queueName}] message [${payload.messageId}]`;

      for (let attempt = 1; attempt <= maxTries; attempt += 1) {
        const failure = await processOnce();
        if (failure === null) {
          return;
        }

        if (attempt < maxTries) {
          console.warn(`${label} failed on try ${attempt} of ${maxTries}, retrying in ${retryDelayMs / 1000}s:`, failure);
          await sleep(retryDelayMs);
        } else {
          console.error(`${label} failed after ${maxTries} ${maxTries === 1 ? 'try' : 'tries'}; no local dead-letter queue, dropped:`, failure);
        }
      }
    };

    const gate = getQueueGate(payload);
    const processAll = gate ? () => gate.run(processAllUngated) : processAllUngated;

    if (payload.groupId === undefined) {
      await trackInFlight(processAll());
      return;
    }

    const groupKey = `${payload.queueName}:${payload.groupId}`;
    const groupTail = trackInFlight((fifoGroupTails.get(groupKey) ?? Promise.resolve()).then(processAll));
    fifoGroupTails.set(groupKey, groupTail);

    await groupTail;

    // Drop drained groups so the map doesn't grow forever
    if (fifoGroupTails.get(groupKey) === groupTail) {
      fifoGroupTails.delete(groupKey);
    }
  });

  eventBus.on(EventBusActionType.SendMessages, async (payload: AnyEventBusMessageWithSession, correlation: string) => {
    for (const qpqConfig of devServerConfig.qpqConfigs) {
      await processQueueEventBusSubscriptions(qpqConfig, payload);
    }
  });

  // Nothing to take down: the messages themselves are in-flight work, drained
  // by the in-flight plugin, and the bus outlives every listener on it.
  return null;
};
