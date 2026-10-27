import { QPQConfig } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { requireDomainResolver } from '../../appWorkspace/requireDomainResolver';

const isUnder = (host: string, zone: string): boolean => host === zone || host.endsWith(`.${zone}`);

/**
 * The Route53 zone a host's records belong in, derived from the resolver's own output: the
 * root's site root when the host sits under it (the per-environment delegated zone,
 * `api.development.example.com` in `development.example.com`), otherwise the root itself
 * (`development-api.example.com` in `example.com`). Both zones must already exist.
 */
export const resolveHostedZoneForHost = (qpqConfig: QPQConfig, host: string): string => {
  const rootDomain = qpqWebServerUtils.findRootDomainForHost(qpqConfig, host);
  if (!rootDomain) {
    throw new Error(`Host [${host}] is under no declared root domain (defineDns)`);
  }

  const siteRoot = qpqWebServerUtils.resolveHostForRoot(qpqConfig, rootDomain, {}, requireDomainResolver(qpqConfig));

  return isUnder(host, siteRoot) ? siteRoot : rootDomain;
};
