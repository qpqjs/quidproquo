import { CrossModuleOwner, QpqFunctionRuntime } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';

export interface QPQConfigAdvancedDynamicFunctionsSettings extends QPQConfigAdvancedSettings {
  owner?: CrossModuleOwner<'dynamicFunctionsName'>;
}

export interface DynamicFunctionsQPQConfigSetting extends QPQConfigSetting {
  runtime: QpqFunctionRuntime;

  dynamicFunctionsName: string;
}

// Registers a module export - an OBJECT whose properties are functions - under a
// name, so stories can invoke its members via askDynamicFunctionExecute without a
// per-function registration. The successor to defineInlineFunction: one setting
// addresses a whole surface (name + member) instead of one function per entry.
export const defineDynamicFunctions = (
  dynamicFunctionsName: string,
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedDynamicFunctionsSettings,
): DynamicFunctionsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.dynamicFunctions,
  uniqueKey: dynamicFunctionsName,

  runtime,

  dynamicFunctionsName,

  owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
