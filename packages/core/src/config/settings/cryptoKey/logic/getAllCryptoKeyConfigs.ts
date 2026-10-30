import { getConfigSettings } from '../../../../logic/config/getConfigSettings';
import { QPQConfig, QPQCoreConfigSettingType } from '../../../QPQConfig';
import { CryptoKeyQPQConfigSetting } from '../types';

export const getAllCryptoKeyConfigs = (qpqConfig: QPQConfig): CryptoKeyQPQConfigSetting[] =>
  getConfigSettings<CryptoKeyQPQConfigSetting>(qpqConfig, QPQCoreConfigSettingType.cryptoKey);
