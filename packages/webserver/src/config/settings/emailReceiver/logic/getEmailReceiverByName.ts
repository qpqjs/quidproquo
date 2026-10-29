import { Nullable, QPQConfig } from '@qpqjs/core';

import { EmailReceiverQPQWebServerConfigSetting } from '../types';
import { getAllEmailReceiverConfigs } from './getAllEmailReceiverConfigs';

export const getEmailReceiverByName = (name: string, qpqConfig: QPQConfig): Nullable<EmailReceiverQPQWebServerConfigSetting> =>
  getAllEmailReceiverConfigs(qpqConfig).find((receiver) => receiver.name === name) ?? null;
