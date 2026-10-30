import { QPQConfig } from '@qpqjs/core';

import { CacheQPQWebServerConfigSetting } from '../types';
import { getCacheByName } from './getCacheByName';

export const resolveCacheOrThrow = (name: string, qpqConfig: QPQConfig): CacheQPQWebServerConfigSetting => {
  const cache = getCacheByName(name, qpqConfig);

  if (!cache) {
    throw new Error(`No cache config found for name [${name}]`);
  }

  return cache;
};
