import { Nullable, QPQConfig } from '@qpqjs/core';

import { CacheQPQWebServerConfigSetting } from '../types';
import { getAllCacheConfigs } from './getAllCacheConfigs';

export const getCacheByName = (name: string, qpqConfig: QPQConfig): Nullable<CacheQPQWebServerConfigSetting> =>
  getAllCacheConfigs(qpqConfig).find((cache) => cache.name === name) ?? null;
