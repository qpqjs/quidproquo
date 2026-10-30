import { QPQWebServerConfigSettingType } from '../../QPQConfig';
import { DnsQPQWebServerConfigSetting, QPQConfigAdvancedDnsSettings } from './types';

/** One per service. Omit the resolver for the default `sub.service.feature.env.root` shape. */
export const defineDns = (rootDomains: string | string[], options?: QPQConfigAdvancedDnsSettings): DnsQPQWebServerConfigSetting => {
  const roots = Array.isArray(rootDomains) ? rootDomains : [rootDomains];

  return {
    configSettingType: QPQWebServerConfigSettingType.Dns,
    uniqueKey: roots.join('|'),

    rootDomains: roots,
    resolver: options?.resolver,
  };
};
