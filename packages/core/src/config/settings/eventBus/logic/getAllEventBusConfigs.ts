import { getConfigSettings } from '../../../../logic/config/getConfigSettings';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { EventBusQPQConfigSetting } from '../types';

export const getAllEventBusConfigs = (qpqConfig: QPQConfig): EventBusQPQConfigSetting[] =>
  getConfigSettings<EventBusQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.eventBus);
