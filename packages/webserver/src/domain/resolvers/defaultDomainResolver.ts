import { DomainResolver } from '../../domain/types/DomainResolver';

/** `[subdomain.][service.][feature.][environment.]root`, with no environment label in production. */
export const defaultDomainResolver: DomainResolver = {
  resolveHost: ({ rootDomain, environment, feature, service, subdomain }) => {
    const environmentLabel = environment === 'production' ? undefined : environment;

    return [subdomain, service, feature, environmentLabel, rootDomain].filter(Boolean).join('.');
  },
};
