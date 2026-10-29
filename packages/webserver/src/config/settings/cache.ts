import { CrossModuleOwner, QPQConfigAdvancedSettings, QPQConfigSetting, qpqCoreUtils } from '@qpqjs/core';

import { CacheSettings, QPQWebServerConfigSettingType } from '../QPQConfig';

export type QPQConfigAdvancedCacheSettings = {
  owner?: CrossModuleOwner<'cacheName'>;
} & QPQConfigAdvancedSettings;

export type CacheQPQWebServerConfigSetting = {
  name: string;

  cache: CacheSettings;
} & QPQConfigSetting;

export const defineCache = (name: string, cache: CacheSettings, options?: QPQConfigAdvancedCacheSettings): CacheQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.Cache,
  uniqueKey: name,

  name,

  cache: cache,

  owner: qpqCoreUtils.convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
