import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../../utils/crossModuleUtils';
import { QPQConfigAdvancedSecretSettings, SecretQPQConfigSetting } from './types';

export const defineSecret = (key: string, options?: QPQConfigAdvancedSecretSettings): SecretQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.secret,
  uniqueKey: key,

  key,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
