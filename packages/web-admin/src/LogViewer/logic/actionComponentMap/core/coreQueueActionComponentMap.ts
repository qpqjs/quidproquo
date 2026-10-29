import { QueueActionType } from '@qpqjs/core';

const coreQueueActionComponentMap: Record<string, string[]> = {
  [QueueActionType.SendMessage]: ['askQueueSendMessages', 'queueName', 'queueMessages'],
};

export default coreQueueActionComponentMap;
