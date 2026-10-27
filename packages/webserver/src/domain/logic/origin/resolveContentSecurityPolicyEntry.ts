import { QPQConfig } from 'quidproquo-core';

import { ContentSecurityPolicyEntry } from '../../../config/types/ResponseSecurityHeaders';
import { DomainResolver } from '../../../domain/types/DomainResolver';
import { resolveHostForRoot } from '../host/resolveHostForRoot';
import { resolveHosts } from '../host/resolveHosts';

/**
 * CSP source values for an entry: a string passes through, a service entry becomes one
 * host per root (or the pinned `domain`'s), prefixed with the protocol only when given,
 * since CSP accepts bare hosts.
 */
export const resolveContentSecurityPolicyEntry = (qpqConfig: QPQConfig, entry: ContentSecurityPolicyEntry, resolver?: DomainResolver): string[] => {
  if (typeof entry === 'string') {
    return [entry];
  }

  const target = { subdomain: entry.api, service: entry.service };
  const hosts = entry.domain ? [resolveHostForRoot(qpqConfig, entry.domain, target, resolver)] : resolveHosts(qpqConfig, target, resolver);

  return hosts.map((host) => (entry.protocol ? `${entry.protocol}://${host}` : host));
};
