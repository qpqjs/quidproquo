import { QPQConfigSetting, QpqPureFunction } from '@qpqjs/core';

/**
 * The app's root domains, primary first. `resolver` points at the app's hostname shape: the
 * deploy tooling requires it, the runtime loads it through the dynamic module loader, and
 * every site resolves hosts with `resolveHosts(qpqConfig, target, resolver)`.
 */
export type DnsQPQWebServerConfigSetting = QPQConfigSetting & {
  rootDomains: string[];
  resolver?: QpqPureFunction;

  /**
   * The root whose resources keep the unsuffixed names they were first deployed under; see
   * `QPQConfigAdvancedDnsSettings.legacyUnsuffixedRootDomain`.
   *
   * TODO: remove for version 1 of quidproquo.
   */
  legacyUnsuffixedRootDomain?: string;
};
