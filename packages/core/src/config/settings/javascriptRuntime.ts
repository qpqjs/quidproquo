import { QPQConfigAdvancedSettings, QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

// Cloud-agnostic runtime identifiers - the deploy layer maps these to
// platform specific values (e.g. aws_lambda.Runtime / aws_lambda.Architecture)
export enum JavascriptRuntimeVersion {
  Node20 = 'node20',
  Node22 = 'node22',
  Node24 = 'node24',
}

export enum JavascriptRuntimeArchitecture {
  Arm64 = 'arm64',
  X86_64 = 'x86_64',
}

export interface QPQConfigAdvancedJavascriptRuntimeSettings extends QPQConfigAdvancedSettings {
  runtimeVersion?: JavascriptRuntimeVersion;
  architecture?: JavascriptRuntimeArchitecture;
}

export interface JavascriptRuntimeQPQConfigSetting extends QPQConfigSetting {
  runtimeVersion: JavascriptRuntimeVersion;
  architecture: JavascriptRuntimeArchitecture;
}

export const defineJavascriptRuntime = (options?: QPQConfigAdvancedJavascriptRuntimeSettings): JavascriptRuntimeQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.javascriptRuntime,
  uniqueKey: 'JavascriptRuntime',

  runtimeVersion: options?.runtimeVersion ?? JavascriptRuntimeVersion.Node22,
  architecture: options?.architecture ?? JavascriptRuntimeArchitecture.Arm64,
});
