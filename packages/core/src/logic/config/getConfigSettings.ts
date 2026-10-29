import { QPQConfig, QPQConfigSetting } from '../../config/QPQConfig';
import { flattenQpqConfig } from './flattenQpqConfig';

// Every setting of one type, in declaration order, from the flattened config.
export const getConfigSettings = <T extends QPQConfigSetting>(qpqConfig: QPQConfig, configSettingType: string): T[] =>
  flattenQpqConfig(qpqConfig).filter((c) => c.configSettingType === configSettingType) as T[];
