import { CrossModuleOwner, QpqFunctionRuntime } from '../../types';
import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';
import { convertCrossModuleOwnerToGenericResourceNameOverride } from '../utils/crossModuleUtils';
import { getStoryNameFromQpqFunctionRuntime } from '../utils/qpqFunctionRuntimeUtils';

export type QPQConfigAdvancedInlineFunctionSettings = {
  functionName?: string;

  owner?: CrossModuleOwner<'functionName'>;
} & QPQConfigAdvancedSettings;

export type InlineFunctionQPQConfigSetting = {
  runtime: QpqFunctionRuntime;

  functionName: string;
} & QPQConfigSetting;

export const defineInlineFunction = (
  runtime: QpqFunctionRuntime,
  options?: QPQConfigAdvancedInlineFunctionSettings,
): InlineFunctionQPQConfigSetting => {
  const functionName = options?.functionName ?? getStoryNameFromQpqFunctionRuntime(runtime);

  return {
    configSettingType: QPQCoreConfigSettingType.inlineFunction,
    uniqueKey: functionName,

    runtime,

    functionName: functionName,

    owner: convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
  };
};
