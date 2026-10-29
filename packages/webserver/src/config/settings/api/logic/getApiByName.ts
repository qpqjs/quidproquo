import { Nullable, QPQConfig } from '@qpqjs/core';

import { ApiQPQWebServerConfigSetting } from '../types';
import { getAllApiConfigs } from './getAllApiConfigs';

export const getApiByName = (apiName: string, qpqConfig: QPQConfig): Nullable<ApiQPQWebServerConfigSetting> =>
  getAllApiConfigs(qpqConfig).find((api) => api.apiName === apiName) ?? null;
