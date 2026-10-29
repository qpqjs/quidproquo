import { QPQConfigSetting } from '../../../QPQConfig';
import { JavascriptRuntimeArchitecture } from './JavascriptRuntimeArchitecture';
import { JavascriptRuntimeVersion } from './JavascriptRuntimeVersion';

export type JavascriptRuntimeQPQConfigSetting = {
  runtimeVersion: JavascriptRuntimeVersion;
  architecture: JavascriptRuntimeArchitecture;
} & QPQConfigSetting;
