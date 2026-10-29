import { QPQConfigSetting } from '@qpqjs/core';

import { CacheSettings } from '../../../QPQConfig';

export type CacheQPQWebServerConfigSetting = {
  name: string;

  cache: CacheSettings;
} & QPQConfigSetting;
