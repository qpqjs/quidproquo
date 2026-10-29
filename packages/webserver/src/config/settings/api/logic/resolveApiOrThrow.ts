import { QPQConfig } from '@qpqjs/core';

import { ApiQPQWebServerConfigSetting } from '../types';
import { getApiByName } from './getApiByName';

export const resolveApiOrThrow = (apiName: string, qpqConfig: QPQConfig): ApiQPQWebServerConfigSetting => {
  const api = getApiByName(apiName, qpqConfig);

  if (!api) {
    throw new Error(`No api setting found for [${apiName}]`);
  }

  return api;
};
