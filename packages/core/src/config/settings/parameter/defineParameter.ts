import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../../utils/crossModuleUtils';
import { ParameterQPQConfigSetting, QPQConfigAdvancedParameterSettings } from './types';

export const defineParameter = (key: string, options?: QPQConfigAdvancedParameterSettings): ParameterQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.parameter,
  uniqueKey: key,

  key,
  value: options?.value ?? '',

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
