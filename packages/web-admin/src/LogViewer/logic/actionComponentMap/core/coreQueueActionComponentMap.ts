import { QueueActionType } from '@qpqjs/core';

const coreQueueActionComponentMap: Record<string, string[]> = {
  [QueueActionType.SendMessages]: ['askQueueSendMessages', 'queueName', 'queueMessages'],
};

export default coreQueueActionComponentMap;
