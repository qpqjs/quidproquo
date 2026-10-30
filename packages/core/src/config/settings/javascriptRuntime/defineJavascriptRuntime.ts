import { QPQCoreConfigSettingType } from '../../QPQConfig';
import {
  JavascriptRuntimeArchitecture,
  JavascriptRuntimeQPQConfigSetting,
  JavascriptRuntimeVersion,
  QPQConfigAdvancedJavascriptRuntimeSettings,
} from './types';

export const defineJavascriptRuntime = (options?: QPQConfigAdvancedJavascriptRuntimeSettings): JavascriptRuntimeQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.javascriptRuntime,
  uniqueKey: 'JavascriptRuntime',

  runtimeVersion: options?.runtimeVersion ?? JavascriptRuntimeVersion.Node22,
  architecture: options?.architecture ?? JavascriptRuntimeArchitecture.Arm64,
});
