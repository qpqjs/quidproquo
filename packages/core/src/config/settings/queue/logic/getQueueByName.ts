import { Nullable } from '../../../../types/Nullable';
import { QPQConfig } from '../../../QPQConfig';
import { QueueQPQConfigSetting } from '../types';
import { getAllQueueConfigs } from './getAllQueueConfigs';

export const getQueueByName = (name: string, qpqConfig: QPQConfig): Nullable<QueueQPQConfigSetting> =>
  getAllQueueConfigs(qpqConfig).find((queue) => queue.name === name) ?? null;
