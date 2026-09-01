import {
  EventBusActionType,
  generateUuid,
  Nullable,
  QPQConfig,
  qpqCoreUtils,
  QpqFunctionRuntime,
  QpqRuntimeType,
  QueueActionType,
} from 'quidproquo-core';

import { getQueueEventProcessor } from '../actionProcessor/core/event/queue';
import { AnyQueueMessageWithSession } from '../actionProcessor/core/event/queue/types';
import { AnyEventBusMessageWithSession } from '../actionProcessor/core/eventBus/getEventBusSendMessagesActionProcessor';
import { eventBus, processEvent, trackInFlight } from '../logic';
import { DevServerPluginStop } from '../plugins/types/DevServerPluginStop';
import { ResolvedDevServerConfig } from '../types';

const getDynamicModuleLoader = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig) => {
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);
  return async (runtime: QpqFunctionRuntime): Promise<any> => devServerConfig.dynamicModuleLoader(serviceName, runtime);
};

const processQueueMessages = async (qpqConfig: QPQConfig, payload: AnyQueueMessageWithSession, devServerConfig: ResolvedDevServerConfig) => {
  if (payload.targetEnvironment !== qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig)) {
    return;
  }

  if (payload.targetApplication !== qpqCoreUtils.getApplicationName(qpqConfig)) {
    return;
  }

  if (payload.targetModule !== qpqCoreUtils.getApplicationModuleName(qpqConfig)) {
    return;
  }

  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);
  if ((!!payload.targetFeature || !!feature) && payload.targetFeature !== feature) {
    return;
  }

  await processEvent<AnyQueueMessageWithSession, any>(
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
  const thisServiceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  // console.log('------------------------');
  // console.log(`Service trying to process message [${thisServiceName}]`);
  // console.log('Processing event bus message', ebMessage.type);

  const allEventBuses = qpqCoreUtils.getAllEventBusConfigs(qpqConfig).filter((ebc) => {
    const srcApplication = ebc.owner?.application || qpqCoreUtils.getApplicationName(qpqConfig);
    const srcEnvironment = ebc.owner?.environment || qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
    const srcFeature = ebc.owner?.feature || qpqCoreUtils.getApplicationModuleFeature(qpqConfig);
    const srcModule = ebc.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig);

    return (
      srcApplication === ebMessage.targetApplication &&
      srcEnvironment === ebMessage.targetEnvironment &&
      srcModule === ebMessage.targetModule &&
      ((!srcFeature && !ebMessage.targetFeature) || srcFeature === ebMessage.targetFeature)
    );
  });
  //  console.log(
  //   'All event buses',
  //   JSON.stringify(
  //     allEventBuses.map((eb) => eb.name),
  //     null,
  //     2,
  //   ),
  // );

  // All the queues that we should publish to
  const queues = qpqCoreUtils
    .getOwnedQueues(qpqConfig)
    .filter((q) => {
      return !!q.eventBusSubscriptions.find((ebsub) => {
        return allEventBuses.some((eb) => ebsub === eb.name);
      });
    })
    .filter(
      (q) =>
        // The target is this service
        (!q.owner?.module || q.owner?.module === thisServiceName) &&
        // And we are subed to the message that its trying to get to
        q.eventBusSubscriptions.includes(ebMessage.eventBusName),
    );

  // console.log(
  //   'All queues',
  //   JSON.stringify(
  //     queues.map((eb) => eb.name),
  //     null,
  //     2,
  //   ),
  // );

  for (const queue of queues) {
    const queueMessage: AnyQueueMessageWithSession = {
      payload: ebMessage.payload,
      type: ebMessage.type,

      storySession: ebMessage.storySession,

      queueName: queue.name,

      // FIFO: carry the bus message's group through to the queue, like SNS FIFO -> SQS FIFO
      groupId: queue.isFifo ? ebMessage.groupId : undefined,

      targetApplication: queue.owner?.application || qpqCoreUtils.getApplicationName(qpqConfig),
      targetEnvironment: queue.owner?.environment || qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
      targetFeature: queue.owner?.feature || qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
      targetModule: queue.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig),

      messageId: generateUuid(),
    };

    // console.log(JSON.stringify(queueMessage, null, 2));

    eventBus.publish(QueueActionType.SendMessages, queueMessage);
  }

  // console.log('------------------------');
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

  eventBus.on(QueueActionType.SendMessages, async (payload: AnyQueueMessageWithSession, correlation: string) => {
    const processAll = async () => {
      try {
        for (const qpqConfig of devServerConfig.qpqConfigs) {
          await processQueueMessages(qpqConfig, payload, devServerConfig);
        }
      } catch (error) {
        console.error(`Queue [${payload.queueName}] message [${payload.messageId}] failed:`, error);
      }
    };

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
