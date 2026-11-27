import { QPQWebServerConfigSettingType } from '../../QPQConfig';
import { DnsQPQWebServerConfigSetting, QPQConfigAdvancedDnsSettings } from './types';

/**
 * One per service. Omit the resolver for the default `sub.service.feature.env.root` shape.
 *
 * `legacyUnsuffixedRootDomain` is only for an app first deployed before each root's resources
 * were named after the root. TODO: remove it for version 1 of quidproquo.
 */
export const defineDns = (rootDomains: string | string[], options?: QPQConfigAdvancedDnsSettings): DnsQPQWebServerConfigSetting => {
  const roots = Array.isArray(rootDomains) ? rootDomains : [rootDomains];

  return {
    configSettingType: QPQWebServerConfigSettingType.Dns,
    uniqueKey: roots.join('|'),

    rootDomains: roots,
    resolver: options?.resolver,
    legacyUnsuffixedRootDomain: options?.legacyUnsuffixedRootDomain,
  };
};
