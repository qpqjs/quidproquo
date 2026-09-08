import { QPQConfig } from 'quidproquo-core';

import { DomainResolver } from '../../../domain/types/DomainResolver';
import { resolveHosts } from '../host/resolveHosts';

/**
 * CORS origins for a service resource: an explicit list wins; otherwise the site root plus a
 * one-level subdomain wildcard on every root (S3 and CloudFront both accept that form).
 * '*' only when the service declares no domain at all (nothing browser-facing).
 */
export const resolveServiceScopedCorsAllowedOrigins = (qpqConfig: QPQConfig, explicitOrigins?: string[], resolver?: DomainResolver): string[] => {
  if (explicitOrigins) {
    return explicitOrigins;
  }

  const hosts = resolveHosts(qpqConfig, {}, resolver);
  if (hosts.length === 0) {
    return ['*'];
  }

  return hosts.flatMap((host) => [`https://${host}`, `https://*.${host}`]);
};
