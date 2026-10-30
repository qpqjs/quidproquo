import { qpqCoreUtils } from '@qpqjs/core';

import { CacheSettings, QPQWebServerConfigSettingType } from '../../QPQConfig';
import { CacheQPQWebServerConfigSetting, QPQConfigAdvancedCacheSettings } from './types';

export const defineCache = (name: string, cache: CacheSettings, options?: QPQConfigAdvancedCacheSettings): CacheQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.Cache,
  uniqueKey: name,

  name,

  cache: cache,

  owner: qpqCoreUtils.convertCrossModuleOwnerToGenericResourceNameOverride(options?.owner),
});
