import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { ApiQPQWebServerConfigSetting } from '../types';
import { getAllApiConfigs } from './getAllApiConfigs';

export const getOwnedApiConfigs = (qpqConfig: QPQConfig): ApiQPQWebServerConfigSetting[] =>
  qpqCoreUtils.getOwnedItems(getAllApiConfigs(qpqConfig), qpqConfig);
