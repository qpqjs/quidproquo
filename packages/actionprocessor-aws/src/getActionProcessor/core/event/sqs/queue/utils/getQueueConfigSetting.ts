import { QPQConfig, qpqCoreUtils, QueueQPQConfigSetting } from '@qpqjs/core';

// Only the queue name travels via the lambda environment; the full setting lives in the bundled
// qpqConfig (serializing it into env blows the lambda 4KB limit).
export const getQueueConfigSetting = (qpqConfig: QPQConfig, queueName: string): QueueQPQConfigSetting => {
  const queueQPQConfigSetting = qpqCoreUtils.getQueueByName(qpqConfig, queueName);

  if (!queueQPQConfigSetting) {
    throw new Error(`No queue config setting found for queue [${queueName}]`);
  }

  return queueQPQConfigSetting;
};
