import { CrossModuleOwner, QPQConfigAdvancedSettings, QPQConfigSetting, qpqCoreUtils } from 'quidproquo-core';

import { CacheSettings, QPQWebServerConfigSettingType } from '../QPQConfig';

export interface QPQConfigAdvancedCacheSettings extends QPQConfigAdvancedSettings {
  owner?: CrossModuleOwner<'cacheName'>;
}

export interface CacheQPQWebServerConfigSetting extends QPQConfigSetting {
  name: string;

  cache: CacheSettings;
}

export const defineCache = (name: string, cache: CacheSettings, options?: QPQConfigAdvancedCacheSettings): CacheQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.Cache,
  uniqueKey: name,

  name,

  cache: cache,

  owner: qpqCoreUtils.convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
