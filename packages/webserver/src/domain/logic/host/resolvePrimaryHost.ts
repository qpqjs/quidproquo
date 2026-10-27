import { QPQConfig } from 'quidproquo-core';

import { DomainResolver } from '../../../domain/types/DomainResolver';
import { DomainTarget } from '../../../domain/types/DomainTarget';
import { resolveHosts } from './resolveHosts';

/** The host on the primary root, for anything that must bake exactly one absolute URL. Throws without a domain. */
export const resolvePrimaryHost = (qpqConfig: QPQConfig, target: DomainTarget, resolver?: DomainResolver): string => {
  const [primary] = resolveHosts(qpqConfig, target, resolver);

  if (!primary) {
    throw new Error('resolvePrimaryHost: the service declares no domain (defineDns)');
  }

  return primary;
};
