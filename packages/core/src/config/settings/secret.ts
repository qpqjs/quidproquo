import { CrossModuleOwner } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';

export type QPQConfigAdvancedSecretSettings = {
  owner?: CrossModuleOwner<'secretName'>;
} & QPQConfigAdvancedSettings;

export type SecretQPQConfigSetting = {
  key: string;
} & QPQConfigSetting;

export const defineSecret = (key: string, options?: QPQConfigAdvancedSecretSettings): SecretQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.secret,
  uniqueKey: key,

  key,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
