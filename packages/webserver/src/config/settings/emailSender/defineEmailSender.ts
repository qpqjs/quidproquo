import { QPQWebServerConfigSettingType } from '../../QPQConfig';
import { EmailSenderQPQWebServerConfigSetting } from './types';

/** Sends from the app's root domains (defineDns); one per service. */
export const defineEmailSender = (): EmailSenderQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.EmailSender,
  uniqueKey: 'emailSender',
});
