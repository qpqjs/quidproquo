import { QPQConfigSetting, QpqPureFunction } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';

export type QPQConfigAdvancedDnsSettings = {
  // Pointer to the app's DomainResolver export (a pure function, no actions).
  resolver?: QpqPureFunction;
};

/**
 * The app's root domains, primary first. `resolver` points at the app's hostname shape: the
 * deploy tooling requires it, the runtime loads it through the dynamic module loader, and
 * every site resolves hosts with `resolveHosts(qpqConfig, target, resolver)`.
 */
export type DnsQPQWebServerConfigSetting = QPQConfigSetting & {
  rootDomains: string[];
  resolver?: QpqPureFunction;
};

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
