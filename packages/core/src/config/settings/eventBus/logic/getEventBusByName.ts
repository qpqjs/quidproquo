import { Nullable } from '../../../../types/Nullable';
import { QPQConfig } from '../../../QPQConfig';
import { EventBusQPQConfigSetting } from '../types';
import { getAllEventBusConfigs } from './getAllEventBusConfigs';

// A bus is reachable under the resource name its owner published (a foreign bus) as well as
// its own name; the published name wins when both match.
export const getEventBusByName = (name: string, qpqConfig: QPQConfig): Nullable<EventBusQPQConfigSetting> => {
  const allConfigs = getAllEventBusConfigs(qpqConfig);

  return allConfigs.find((eb) => eb.owner?.resourceNameOverride === name) ?? allConfigs.find((eb) => eb.name === name) ?? null;
};
