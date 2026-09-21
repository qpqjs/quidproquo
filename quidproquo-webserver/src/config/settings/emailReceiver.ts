import { QPQConfigSetting } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export interface EmailReceiverQPQWebServerConfigSetting extends QPQConfigSetting {
  name: string;
  storageDriveName: string;
  keyPrefix: string;
}

export type EmailReceiverOptions = {
  // The drive raw messages are written into. Must be unscoped: the mail provider writes them,
  // not a story, so they land at the bare key.
  storageDriveName: string;
  // Key prefix inside the drive; defaults to `email/<name>/`.
  keyPrefix?: string;
};

/**
 * Receive mail sent to any address at the app's receiving domain (defineEmailReceivingDomain):
 * every message lands as one raw MIME object in `storageDriveName` under `keyPrefix`. What
 * happens next is the app's: a file event on the drive, a schedule, a queue. askEmailParse
 * turns an object into a message. Deployed platforms only; the dev server does not receive mail.
 */
export const defineEmailReceiver = (name: string, options: EmailReceiverOptions): EmailReceiverQPQWebServerConfigSetting => ({
  configSettingType: QPQWebServerConfigSettingType.EmailReceiver,
  uniqueKey: `emailReceiver-${name}`,

  name,
  storageDriveName: options.storageDriveName,
  keyPrefix: options.keyPrefix ?? `email/${name}/`,
});
