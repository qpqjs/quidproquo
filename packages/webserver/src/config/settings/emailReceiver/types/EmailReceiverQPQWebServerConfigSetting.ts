import { QPQConfigSetting } from '@qpqjs/core';

export type EmailReceiverQPQWebServerConfigSetting = {
  name: string;
  // The drive raw messages land in, owned by the receiver; apps never name it.
  storageDriveName: string;
  onEmailFunctionName: string;
} & QPQConfigSetting;
