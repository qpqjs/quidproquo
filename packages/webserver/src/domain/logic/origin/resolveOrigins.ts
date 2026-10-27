import { QPQConfig } from 'quidproquo-core';

import { ServiceAllowedOrigin } from '../../../config/settings/route';
import { DomainResolver } from '../../../domain/types/DomainResolver';
import { resolveHostForRoot } from '../host/resolveHostForRoot';
import { resolveHosts } from '../host/resolveHosts';

/**
 * Browser origins for a CORS / CSP entry: a string passes through, a service entry becomes
 * `${protocol}://host` once per root, or once for the pinned `domain` when it names one.
 */
export const resolveOrigins = (qpqConfig: QPQConfig, entry: string | ServiceAllowedOrigin, resolver?: DomainResolver): string[] => {
  if (typeof entry === 'string') {
    return [entry];
  }

  const protocol = entry.protocol || 'https';
  const target = { subdomain: entry.api, service: entry.service };

  const hosts = entry.domain ? [resolveHostForRoot(qpqConfig, entry.domain, target, resolver)] : resolveHosts(qpqConfig, target, resolver);

  return hosts.map((host) => `${protocol}://${host}`);
};
