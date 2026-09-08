import { Nullable, QPQConfig } from 'quidproquo-core';

import { getRootDomains } from '../../../configUtils/dns/getRootDomains';

/**
 * Which declared root a request host belongs to, longest match wins, null when none does.
 * Used to key request-time behaviour off the Host header without trusting it as a domain.
 */
export const findRootDomainForHost = (qpqConfig: QPQConfig, host: string): Nullable<string> => {
  const hostname = host.split(':')[0].toLowerCase();

  const matches = getRootDomains(qpqConfig).filter((root) => {
    const rootName = root.split(':')[0].toLowerCase();
    return hostname === rootName || hostname.endsWith(`.${rootName}`);
  });

  return matches.sort((a, b) => b.length - a.length)[0] ?? null;
};
