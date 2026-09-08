import { QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export type EmailSenderQPQWebServerConfigSetting = QPQConfigSetting;

/** Sends from the app's root domains (defineDns); one per service. */
export const defineEmailSender = (): EmailSenderQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.EmailSender,
  uniqueKey: 'emailSender',
});
