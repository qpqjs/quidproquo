import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { EmailReceiverQPQWebServerConfigSetting } from '../types';
import { getAllEmailReceiverConfigs } from './getAllEmailReceiverConfigs';

export const getOwnedEmailReceiverConfigs = (qpqConfig: QPQConfig): EmailReceiverQPQWebServerConfigSetting[] =>
  qpqCoreUtils.getOwnedItems(getAllEmailReceiverConfigs(qpqConfig), qpqConfig);
