import { QPQConfig, QPQConfigSetting } from '../../config/QPQConfig';
import { getConfigSettings } from './getConfigSettings';

// The first setting of one type, or undefined when the config has none.
export const getConfigSetting = <T extends QPQConfigSetting>(qpqConfig: QPQConfig, configSettingType: string): T | undefined => {
  const [setting] = getConfigSettings<T>(qpqConfig, configSettingType);
  return setting;
};
