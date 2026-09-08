import { DomainResolver } from '../../domain/types/DomainResolver';

/** Every scope is the root itself (`localhost:3080`): the dev server serves everything from one host. */
export const localhostDomainResolver: DomainResolver = {
  resolveHost: ({ rootDomain }) => rootDomain,
};
