import { getConfigSettings } from '../../../../logic/config/getConfigSettings';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { SigningKeyQPQConfigSetting } from '../types';

export const getAllSigningKeyConfigs = (qpqConfig: QPQConfig): SigningKeyQPQConfigSetting[] =>
  getConfigSettings<SigningKeyQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.signingKey);
