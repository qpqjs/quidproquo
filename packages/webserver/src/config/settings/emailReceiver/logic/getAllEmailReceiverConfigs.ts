import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../../../QPQConfig';
import { EmailReceiverQPQWebServerConfigSetting } from '../types';

export const getAllEmailReceiverConfigs = (qpqConfig: QPQConfig): EmailReceiverQPQWebServerConfigSetting[] =>
  qpqCoreUtils.getConfigSettings<EmailReceiverQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.EmailReceiver);
