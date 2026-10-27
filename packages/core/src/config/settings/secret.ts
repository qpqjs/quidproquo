import { CrossModuleOwner } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';

export interface QPQConfigAdvancedSecretSettings extends QPQConfigAdvancedSettings {
  owner?: CrossModuleOwner<'secretName'>;
}

export interface SecretQPQConfigSetting extends QPQConfigSetting {
  key: string;
}

export const defineSecret = (key: string, options?: QPQConfigAdvancedSecretSettings): SecretQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.secret,
  uniqueKey: key,

  key,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
