import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../../utils/crossModuleUtils';
import { QPQConfigAdvancedSigningKeySettings, SigningKeyQPQConfigSetting } from './types';

export const defineSigningKey = (keyName: string, options?: QPQConfigAdvancedSigningKeySettings): SigningKeyQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.signingKey,
  uniqueKey: keyName,

  keyName,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
