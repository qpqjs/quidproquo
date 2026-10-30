import { QPQConfig } from '../../../QPQConfig';
import { EventBusQPQConfigSetting } from '../types';
import { getEventBusByName } from './getEventBusByName';

export const resolveEventBusOrThrow = (name: string, qpqConfig: QPQConfig): EventBusQPQConfigSetting => {
  const eventBus = getEventBusByName(name, qpqConfig);

  if (!eventBus) {
    throw new Error(`Event bus [${name}] not found`);
  }

  return eventBus;
};
