import { QPQConfig } from '@qpqjs/core';

import { DnsQPQWebServerConfigSetting } from '../types';
import { getDnsConfig } from './getDnsConfig';

export const resolveDnsConfigOrThrow = (qpqConfig: QPQConfig): DnsQPQWebServerConfigSetting => {
  const dns = getDnsConfig(qpqConfig);

  if (!dns) {
    throw new Error('This service declares no domain: add defineDns() to its config');
  }

  return dns;
};
