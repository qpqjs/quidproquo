// import { EventBusActionType, QPQConfig, qpqCoreUtils, QpqFunctionRuntime, QueueActionType } from 'quidproquo-core';

// import { AnyQueueMessageWithSession } from '../actionProcessor/core/event/queue/types';
// import { AnyEventBusMessageWithSession } from '../actionProcessor/core/eventBus/getEventBusSendMessagesActionProcessor';
// import { eventBus } from '../logic';
import { Nullable } from 'quidproquo-core';

import { DevServerPluginStop } from '../plugins/types/DevServerPluginStop';
import { ResolvedDevServerConfig } from '../types';

/*
const processQueueEventBusSubscriptions = async (qpqConfig: QPQConfig, ebMessage: AnyEventBusMessageWithSession) => {
  const allEventBuses = qpqCoreUtils.getAllEventBusConfigs(qpqConfig).filter((ebc) => {
    const thisService = qpqCoreUtils.getApplicationModuleName(qpqConfig);

    const srcApplication = ebc.owner?.application || qpqCoreUtils.getApplicationName(qpqConfig);
    const srcEnvironment = ebc.owner?.environment || qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
    const srcFeature = ebc.owner?.feature || qpqCoreUtils.getApplicationModuleFeature(qpqConfig);
    const srcModule = ebc.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig);

    return (
      srcApplication === ebMessage.targetApplication &&
      srcEnvironment === ebMessage.targetEnvironment &&
      thisService == srcModule &&
      srcModule === ebMessage.targetModule &&
      ((!srcFeature && !ebMessage.targetFeature) || srcFeature === ebMessage.targetFeature)
    );
  });

  // All the queues that we should publish to
  const queues = qpqCoreUtils.getQueues(qpqConfig).filter((q) => {
    return !!q.eventBusSubscriptions.find((ebsub) => {
      return allEventBuses.some((eb) => ebsub === eb.owner?.resourceNameOverride || (!eb.owner?.resourceNameOverride && ebsub === eb.name));
    });
  });

  console.log('allEventBuses: ', queues);

  for (const queue of queues) {
    const queueMessage: AnyQueueMessageWithSession = {
      payload: ebMessage.payload,
      type: ebMessage.type,

      storySession: ebMessage.storySession,

      queueName: queue.name,

      targetApplication: queue.owner?.application || qpqCoreUtils.getApplicationName(qpqConfig),
      targetEnvironment: queue.owner?.environment || qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig),
      targetFeature: queue.owner?.feature || qpqCoreUtils.getApplicationModuleFeature(qpqConfig),
      targetModule: queue.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig),

      messageId: uuidV4(),
    };

    eventBus.publish(QueueActionType.SendMessages, queueMessage);
  }
};
*/

export const eventBusImplementation = async (devServerConfig: ResolvedDevServerConfig): Promise<Nullable<DevServerPluginStop>> => {
  // eventBus.on(EventBusActionType.SendMessages, async (payload: AnyEventBusMessageWithSession, correlation: string) => {
  //   console.log('Event Buss Ready to process!');
  //   for (const qpqConfig of devServerConfig.qpqConfigs) {
  //     await processQueueEventBusSubscriptions(qpqConfig, payload);
  //   }
  // });

  // NOTE: this plugin currently does nothing. Its whole body is the commented
  // block above, and the only live line used to be an `await new Promise(() =>
  // {})` that existed to stop the caller's Promise.all resolving. Queue fan-out
  // for event-bus messages is done by queueImplementation instead. Kept in the
  // list so the change is visible rather than silently dropped; delete it, or
  // finish it, as a follow-up.
  return null;
};
