import { getOwnedItems } from '../../../../logic/config/getOwnedItems';
import { QPQConfig } from '../../../QPQConfig';
import { QueueQPQConfigSetting } from '../types';
import { getAllQueueConfigs } from './getAllQueueConfigs';

export const getOwnedQueueConfigs = (qpqConfig: QPQConfig): QueueQPQConfigSetting[] => getOwnedItems(getAllQueueConfigs(qpqConfig), qpqConfig);
