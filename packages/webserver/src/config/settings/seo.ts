import { generateSimpleHash, QPQConfigAdvancedSettings, QPQConfigSetting, QpqFunctionRuntime } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export type QPQConfigAdvancedSeoSettings = {
  webEntry?: string;
  cacheSettingsName?: string;
} & QPQConfigAdvancedSettings;

export type SeoQPQWebServerConfigSetting = {
  path: string;
  runtime: QpqFunctionRuntime;
  deprecated: boolean;
  webEntry?: string;

  cacheSettingsName?: string;
} & QPQConfigSetting;

export const defineSeo = (path: string, runtime: QpqFunctionRuntime, options?: QPQConfigAdvancedSeoSettings): SeoQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.Seo,
  uniqueKey: generateSimpleHash(path),

  path,
  runtime,

  webEntry: options?.webEntry,
  deprecated: options?.deprecated ?? false,

  cacheSettingsName: options?.cacheSettingsName,
});
