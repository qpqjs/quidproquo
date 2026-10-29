import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../../../QPQConfig';
import { CacheQPQWebServerConfigSetting } from '../types';

export const getAllCacheConfigs = (qpqConfig: QPQConfig): CacheQPQWebServerConfigSetting[] =>
  qpqCoreUtils.getConfigSettings<CacheQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.Cache);
