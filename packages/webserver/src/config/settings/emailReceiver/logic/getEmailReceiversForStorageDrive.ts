import { QPQConfig } from '@qpqjs/core';

import { EmailReceiverQPQWebServerConfigSetting } from '../types';
import { getAllEmailReceiverConfigs } from './getAllEmailReceiverConfigs';

/** The receivers that write into a drive, which the mail provider must be allowed to write into. */
export const getEmailReceiversForStorageDrive = (storageDriveName: string, qpqConfig: QPQConfig): EmailReceiverQPQWebServerConfigSetting[] =>
  getAllEmailReceiverConfigs(qpqConfig).filter((receiver) => receiver.storageDriveName === storageDriveName);
