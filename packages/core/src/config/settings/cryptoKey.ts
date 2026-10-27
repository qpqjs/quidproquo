import { CrossModuleOwner } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';

export interface QPQConfigAdvancedCryptoKeySettings extends QPQConfigAdvancedSettings {
  owner?: CrossModuleOwner<'cryptoKeyName'>;
}

export interface CryptoKeyQPQConfigSetting extends QPQConfigSetting {
  keyName: string;
}

export const defineCryptoKey = (keyName: string, options?: QPQConfigAdvancedCryptoKeySettings): CryptoKeyQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.cryptoKey,
  uniqueKey: keyName,

  keyName,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
