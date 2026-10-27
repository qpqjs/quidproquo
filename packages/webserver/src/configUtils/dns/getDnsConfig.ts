import { Nullable, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../../config/QPQConfig';
import { DnsQPQWebServerConfigSetting } from '../../config/settings/dns';

/** The service's single Dns setting, or null when it declares no domain. Throws on more than one. */
export const getDnsConfig = (qpqConfig: QPQConfig): Nullable<DnsQPQWebServerConfigSetting> => {
  const settings = qpqCoreUtils.getConfigSettings<DnsQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.Dns);

  if (settings.length > 1) {
    throw new Error(`defineDns must appear once per service, found ${settings.length}`);
  }

  return settings[0] ?? null;
};
