import { Nullable, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { QPQWebServerConfigSettingType } from '../../../QPQConfig';
import { DnsQPQWebServerConfigSetting } from '../types';

/** The service's single Dns setting, or null when it declares no domain. Throws on more than one. */
export const getDnsConfig = (qpqConfig: QPQConfig): Nullable<DnsQPQWebServerConfigSetting> => {
  const settings = qpqCoreUtils.getConfigSettings<DnsQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.Dns);

  if (settings.length > 1) {
    throw new Error(`defineDns must appear once per service, found ${settings.length}`);
  }

  return settings[0] ?? null;
};
