import { QPQConfigAdvancedSettings } from '../../../QPQConfig';
import { JavascriptRuntimeArchitecture } from './JavascriptRuntimeArchitecture';
import { JavascriptRuntimeVersion } from './JavascriptRuntimeVersion';

export type QPQConfigAdvancedJavascriptRuntimeSettings = {
  runtimeVersion?: JavascriptRuntimeVersion;
  architecture?: JavascriptRuntimeArchitecture;
} & QPQConfigAdvancedSettings;
