import { CrossModuleOwner, QpqFunctionRuntime } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';
import { getStoryNameFromQpqFunctionRuntime } from '../utils/qpqFunctionRuntimeUtils';

export interface QPQConfigAdvancedInlineFunctionSettings extends QPQConfigAdvancedSettings {
  functionName?: string;

  owner?: CrossModuleOwner<'functionName'>;
}

export interface InlineFunctionQPQConfigSetting extends QPQConfigSetting {
  runtime: QpqFunctionRuntime;

  functionName: string;
}

export const defineInlineFunction = (
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedInlineFunctionSettings,
): InlineFunctionQPQConfigSetting => {
  const functionName = options?.functionName || getStoryNameFromQpqFunctionRuntime(runtime);

  return {
    configSettingType: QPQCoreConfigSettingType.inlineFunction,
    uniqueKey: functionName,

    runtime,

    functionName: functionName,

    owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
  };
};
