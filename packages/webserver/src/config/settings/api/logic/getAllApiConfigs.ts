import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../../../QPQConfig';
import { ApiQPQWebServerConfigSetting } from '../types';

export const getAllApiConfigs = (qpqConfig: QPQConfig): ApiQPQWebServerConfigSetting[] =>
  qpqCoreUtils.getConfigSettings<ApiQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.Api);
