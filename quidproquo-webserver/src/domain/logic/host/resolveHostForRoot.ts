import { QPQConfig } from 'quidproquo-core';

import { getRootDomains } from '../../../configUtils/dns/getRootDomains';
import { DomainResolver } from '../../../domain/types/DomainResolver';
import { DomainTarget } from '../../../domain/types/DomainTarget';
import { resolveHosts } from './resolveHosts';

/** The target's host on one specific declared root. Throws when the root is not declared. */
export const resolveHostForRoot = (qpqConfig: QPQConfig, rootDomain: string, target: DomainTarget, resolver?: DomainResolver): string => {
  const index = getRootDomains(qpqConfig).indexOf(rootDomain);

  if (index < 0) {
    throw new Error(`Root domain [${rootDomain}] is not declared in defineDns`);
  }

  return resolveHosts(qpqConfig, target, resolver)[index];
};
