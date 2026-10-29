import { QPQConfig } from '@qpqjs/core';

import { EmailSenderQPQWebServerConfigSetting } from '../types';
import { getEmailSenderConfig } from './getEmailSenderConfig';

export const resolveEmailSenderConfigOrThrow = (qpqConfig: QPQConfig): EmailSenderQPQWebServerConfigSetting => {
  const sender = getEmailSenderConfig(qpqConfig);

  if (!sender) {
    throw new Error('This service sends no mail: add defineEmailSender() to its config');
  }

  return sender;
};
