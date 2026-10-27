import { QPQConfig } from 'quidproquo-core';

import { getPrimaryRootDomain } from '../../../configUtils/dns/getPrimaryRootDomain';
import { DomainResolver } from '../../../domain/types/DomainResolver';
import { defaultDomainResolver } from '../../resolvers/defaultDomainResolver';
import { localhostDomainResolver } from '../../resolvers/localhostDomainResolver';
import { isLocalhostRootDomain } from './isLocalhostRootDomain';

/** The resolver to run: the one the tooling was given, else localhost under the dev server, else the default shape. */
export const getDomainResolver = (qpqConfig: QPQConfig, resolver?: DomainResolver): DomainResolver => {
  if (resolver) {
    return resolver;
  }

  const primary = getPrimaryRootDomain(qpqConfig);
  if (primary && isLocalhostRootDomain(primary)) {
    return localhostDomainResolver;
  }

  return defaultDomainResolver;
};
