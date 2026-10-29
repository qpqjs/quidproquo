import { buildTestQpqConfig } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { defineDns } from '../../../config/settings/dns';
import { DomainResolver } from '../../../domain/types/DomainResolver';
import { resolveHosts } from '../host/resolveHosts';
import { getDomainResolver } from './getDomainResolver';

// The infra-team shape: `dev-api.example.com`, `dev-ws-ws.example.com`, `example.com` in prod.
const hyphenated: DomainResolver = {
  resolveHost: ({ rootDomain, environment, feature, service, subdomain }) => {
    const label = [feature, environment === 'production' ? undefined : environment, subdomain, service].filter(Boolean).join('-');
    return label ? `${label}.${rootDomain}` : rootDomain;
  },
};

const twoRoots = (environment = 'development') => buildTestQpqConfig([defineDns(['example.com', 'example.org'])], { environment });

describe('getDomainResolver', () => {
  it('prefers the given resolver', () => {
    expect(getDomainResolver(twoRoots(), hyphenated)).toBe(hyphenated);
  });

  it('selects the localhost resolver when the primary root is localhost', () => {
    const config = buildTestQpqConfig([defineDns('localhost:3080')]);
    expect(resolveHosts(config, { subdomain: 'api', service: 'shell' })).toEqual(['localhost:3080']);
  });
});
