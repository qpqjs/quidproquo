import { Nullable, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../../../QPQConfig';
import { EmailSenderQPQWebServerConfigSetting } from '../types';

/** The service's single email sender setting, or null when it sends no mail. Throws on more than one. */
export const getEmailSenderConfig = (qpqConfig: QPQConfig): Nullable<EmailSenderQPQWebServerConfigSetting> => {
  const settings = qpqCoreUtils.getConfigSettings<EmailSenderQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.EmailSender);

  if (settings.length > 1) {
    throw new Error(`defineEmailSender must appear once per service, found ${settings.length}`);
  }

  return settings[0] ?? null;
};
