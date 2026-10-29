import { CrossModuleOwner } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';

export type QPQConfigAdvancedParameterSettings = {
  owner?: CrossModuleOwner<'parameterName'>;
  value?: string;
} & QPQConfigAdvancedSettings;

export type ParameterQPQConfigSetting = {
  key: string;
  value: string;
} & QPQConfigSetting;

export const defineParameter = (key: string, options?: QPQConfigAdvancedParameterSettings): ParameterQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.parameter,
  uniqueKey: key,

  key,
  value: options?.value ?? '',

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
