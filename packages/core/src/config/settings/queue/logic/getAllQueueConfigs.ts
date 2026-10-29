import { getConfigSettings } from '../../../../logic/config/getConfigSettings';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { QueueQPQConfigSetting } from '../types';

export const getAllQueueConfigs = (qpqConfig: QPQConfig): QueueQPQConfigSetting[] =>
  getConfigSettings<QueueQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.queue);
