import { CrossModuleOwner } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';

export type QPQConfigAdvancedCryptoKeySettings = {
  owner?: CrossModuleOwner<'cryptoKeyName'>;
} & QPQConfigAdvancedSettings;

export type CryptoKeyQPQConfigSetting = {
  keyName: string;
} & QPQConfigSetting;

export const defineCryptoKey = (keyName: string, options?: QPQConfigAdvancedCryptoKeySettings): CryptoKeyQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.cryptoKey,
  uniqueKey: keyName,

  keyName,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
