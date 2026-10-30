import { QPQConfigSetting, QpqPureFunction } from '@qpqjs/core';

/**
 * The app's root domains, primary first. `resolver` points at the app's hostname shape: the
 * deploy tooling requires it, the runtime loads it through the dynamic module loader, and
 * every site resolves hosts with `resolveHosts(qpqConfig, target, resolver)`.
 */
export type DnsQPQWebServerConfigSetting = QPQConfigSetting & {
  rootDomains: string[];
  resolver?: QpqPureFunction;
};
