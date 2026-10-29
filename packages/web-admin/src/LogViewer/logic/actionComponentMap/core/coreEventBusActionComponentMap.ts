import { EventBusActionType } from '@qpqjs/core';

const coreEventBusActionComponentMap: Record<string, string[]> = {
  [EventBusActionType.SendMessage]: ['askEventBusSendMessages', 'eventBusName', 'eventBusMessages'],
};

export default coreEventBusActionComponentMap;
