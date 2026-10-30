import { getConfigSettings } from '../../../../logic/config/getConfigSettings';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { KeyValueStoreQPQConfigSetting } from '../types';

export const getAllKeyValueStoreConfigs = <T extends object = any>(qpqConfig: QPQConfig): KeyValueStoreQPQConfigSetting<T>[] =>
  getConfigSettings<KeyValueStoreQPQConfigSetting<T>>(qpqConfig, QPQCoreConfigSettingType.keyValueStore);
