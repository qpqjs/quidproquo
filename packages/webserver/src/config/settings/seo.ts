import { generateSimpleHash, QPQConfigAdvancedSettings, QPQConfigSetting, QpqFunctionRuntime } from 'quidproquo-core';

import { CacheSettings, QPQWebServerConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedSeoSettings extends QPQConfigAdvancedSettings {
  webEntry?: string;
  cacheSettingsName?: string;
}

export interface SeoQPQWebServerConfigSetting extends QPQConfigSetting {
  path: string;
  runtime: QpqFunctionRuntime;
  deprecated: boolean;
  webEntry?: string;

  cacheSettingsName?: string;
}

export const defineSeo = (path: string, runtime: QpqFunctionRuntime, options?: QPQConfigAdvancedSeoSettings): SeoQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.Seo,
  uniqueKey: generateSimpleHash(path),

  path,
  runtime,

  webEntry: options?.webEntry,
  deprecated: options?.deprecated || false,

  cacheSettingsName: options?.cacheSettingsName,
});
