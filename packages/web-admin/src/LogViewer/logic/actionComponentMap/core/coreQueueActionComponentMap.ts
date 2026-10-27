import { QueueActionType } from 'quidproquo-core';

const coreQueueActionComponentMap: Record<string, string[]> = {
  [QueueActionType.SendMessages]: ['askQueueSendMessages', 'queueName', 'queueMessages'],
};

export default coreQueueActionComponentMap;
