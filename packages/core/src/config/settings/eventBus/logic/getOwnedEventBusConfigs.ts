import { getOwnedItems } from '../../../../logic/config/getOwnedItems';
import { QPQConfig } from '../../../QPQConfig';
import { EventBusQPQConfigSetting } from '../types';
import { getAllEventBusConfigs } from './getAllEventBusConfigs';

export const getOwnedEventBusConfigs = (qpqConfig: QPQConfig): EventBusQPQConfigSetting[] =>
  getOwnedItems(getAllEventBusConfigs(qpqConfig), qpqConfig);
