import { Nullable, QPQConfig } from 'quidproquo-core';

import { DomainResolver } from '../../../domain/types/DomainResolver';
import { DomainTarget } from '../../../domain/types/DomainTarget';
import { findRootDomainForHost } from './findRootDomainForHost';
import { resolveHostForRoot } from './resolveHostForRoot';
import { resolveHosts } from './resolveHosts';

/**
 * The target's host on the root a request arrived on. Only a declared root counts (the Host
 * header is attacker-controlled); a request on no declared root gets the primary's host, and
 * null means the service declares no domain at all.
 */
export const resolveHostForRequestHost = (
  qpqConfig: QPQConfig,
  requestHost: string | undefined,
  target: DomainTarget = {},
  resolver?: DomainResolver,
): Nullable<string> => {
  const rootDomain = requestHost ? findRootDomainForHost(qpqConfig, requestHost) : null;

  if (rootDomain) {
    return resolveHostForRoot(qpqConfig, rootDomain, target, resolver);
  }

  return resolveHosts(qpqConfig, target, resolver)[0] ?? null;
};
