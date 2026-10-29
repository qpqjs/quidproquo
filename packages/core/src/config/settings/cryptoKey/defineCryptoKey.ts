import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../../utils/crossModuleUtils';
import { CryptoKeyQPQConfigSetting, QPQConfigAdvancedCryptoKeySettings } from './types';

export const defineCryptoKey = (keyName: string, options?: QPQConfigAdvancedCryptoKeySettings): CryptoKeyQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.cryptoKey,
  uniqueKey: keyName,

  keyName,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
