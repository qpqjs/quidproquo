import { EventBusActionType } from '@qpqjs/core';

const coreEventBusActionComponentMap: Record<string, string[]> = {
  [EventBusActionType.SendMessages]: ['askEventBusSendMessages', 'eventBusName', 'eventBusMessages'],
};

export default coreEventBusActionComponentMap;
