import { DomainScope } from '../../../domain/types/DomainScope';

/** A resolver may shape labels under the root but never invent another apex. */
export const validateResolvedHost = (host: string, scope: DomainScope): string => {
  const isUnderRoot = host === scope.rootDomain || host.endsWith(`.${scope.rootDomain}`);

  if (!host || !isUnderRoot) {
    throw new Error(`Domain resolver returned [${host}] for root [${scope.rootDomain}]; hosts must be the root or end with .${scope.rootDomain}`);
  }

  return host;
};
