import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { CacheQPQWebServerConfigSetting } from '../types';
import { getAllCacheConfigs } from './getAllCacheConfigs';

export const getOwnedCacheConfigs = (qpqConfig: QPQConfig): CacheQPQWebServerConfigSetting[] =>
  qpqCoreUtils.getOwnedItems(getAllCacheConfigs(qpqConfig), qpqConfig);
