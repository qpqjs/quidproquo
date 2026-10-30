import { getConfigSettings } from '../../../../logic/config/getConfigSettings';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { SecretQPQConfigSetting } from '../types';

export const getAllSecretConfigs = (qpqConfig: QPQConfig): SecretQPQConfigSetting[] =>
  getConfigSettings<SecretQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.secret);
