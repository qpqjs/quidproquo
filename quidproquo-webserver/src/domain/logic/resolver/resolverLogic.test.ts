import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineApi } from '../../../config/settings/api';
import { defineDns } from '../../../config/settings/dns';
import { defineStorageDriveCorsSettings } from '../../../config/settings/storageDriveCorsSettings';
import { getDnsConfig } from '../../../configUtils/dns/getDnsConfig';
import { getRootDomains } from '../../../configUtils/dns/getRootDomains';
import { defaultDomainResolver } from '../../../domain/resolvers/defaultDomainResolver';
import { DomainResolver } from '../../../domain/types/DomainResolver';
import { findRootDomainForHost } from '../host/findRootDomainForHost';
import { resolveHostForRequestHost } from '../host/resolveHostForRequestHost';
import { resolveHostForRoot } from '../host/resolveHostForRoot';
import { resolveHosts } from '../host/resolveHosts';
import { resolvePrimaryHost } from '../host/resolvePrimaryHost';
import { getStorageDriveCorsAllowedOrigins } from '../origin/getStorageDriveCorsAllowedOrigins';
import { resolveContentSecurityPolicyEntry } from '../origin/resolveContentSecurityPolicyEntry';
import { resolveOrigins } from '../origin/resolveOrigins';
import { resolveServiceScopedCorsAllowedOrigins } from '../origin/resolveServiceScopedCorsAllowedOrigins';
import { getDomainResolver } from './getDomainResolver';
import { loadDomainResolver } from './loadDomainResolver';

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
