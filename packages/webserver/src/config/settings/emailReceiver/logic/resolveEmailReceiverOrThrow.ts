import { QPQConfig } from '@qpqjs/core';

import { EmailReceiverQPQWebServerConfigSetting } from '../types';
import { getEmailReceiverByName } from './getEmailReceiverByName';

export const resolveEmailReceiverOrThrow = (name: string, qpqConfig: QPQConfig): EmailReceiverQPQWebServerConfigSetting => {
  const receiver = getEmailReceiverByName(name, qpqConfig);

  if (!receiver) {
    throw new Error(`No email receiver setting found for [${name}]`);
  }

  return receiver;
};
