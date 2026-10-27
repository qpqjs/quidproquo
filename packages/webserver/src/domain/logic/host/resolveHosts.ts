import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { getDnsConfig } from '../../../configUtils/dns/getDnsConfig';
import { DomainResolver } from '../../../domain/types/DomainResolver';
import { DomainTarget } from '../../../domain/types/DomainTarget';
import { getDomainResolver } from '../resolver/getDomainResolver';
import { validateResolvedHost } from '../resolver/validateResolvedHost';

/**
 * One host per declared root, primary first; empty when the service has no domain. Runs the
 * resolver given (the app's, obtained with `requireDomainResolver` at synth and build time or
 * `loadDomainResolver` at runtime), else the localhost or default built-in.
 */
export const resolveHosts = (qpqConfig: QPQConfig, target: DomainTarget, resolver?: DomainResolver): string[] => {
  const dns = getDnsConfig(qpqConfig);
  if (!dns) {
    return [];
  }

  const activeResolver = getDomainResolver(qpqConfig, resolver);
  const environment = qpqCoreUtils.getApplicationModuleEnvironment(qpqConfig);
  const feature = qpqCoreUtils.getApplicationModuleFeature(qpqConfig);

  return dns.rootDomains.map((rootDomain) => {
    const scope = { rootDomain, environment, feature, service: target.service, subdomain: target.subdomain };

    return validateResolvedHost(activeResolver.resolveHost(scope), scope);
  });
};
