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
import { getDomainResolver } from '../resolver/getDomainResolver';
import { loadDomainResolver } from '../resolver/loadDomainResolver';
import { getStorageDriveCorsAllowedOrigins } from './getStorageDriveCorsAllowedOrigins';
import { resolveContentSecurityPolicyEntry } from './resolveContentSecurityPolicyEntry';
import { resolveOrigins } from './resolveOrigins';
import { resolveServiceScopedCorsAllowedOrigins } from './resolveServiceScopedCorsAllowedOrigins';

// The infra-team shape: `dev-api.example.com`, `dev-ws-ws.example.com`, `example.com` in prod.
const hyphenated: DomainResolver = {
  resolveHost: ({ rootDomain, environment, feature, service, subdomain }) => {
    const label = [feature, environment === 'production' ? undefined : environment, subdomain, service].filter(Boolean).join('-');
    return label ? `${label}.${rootDomain}` : rootDomain;
  },
};

const twoRoots = (environment = 'development') => buildTestQpqConfig([defineDns(['example.com', 'example.org'])], { environment });

describe('resolveOrigins', () => {
  it('passes strings through and expands entries per root', () => {
    expect(resolveOrigins(twoRoots('production'), 'https://x.com')).toEqual(['https://x.com']);
    expect(resolveOrigins(twoRoots('production'), { api: 'api', service: 'billing' })).toEqual([
      'https://api.billing.example.com',
      'https://api.billing.example.org',
    ]);
  });

  it('pins to one root when the entry names a domain', () => {
    expect(resolveOrigins(twoRoots('production'), { api: 'api', domain: 'example.org', protocol: 'http' })).toEqual(['http://api.example.org']);
  });
});

describe('resolveContentSecurityPolicyEntry', () => {
  it('emits bare hosts unless a protocol is given', () => {
    expect(resolveContentSecurityPolicyEntry(twoRoots('production'), "'self'")).toEqual(["'self'"]);
    expect(resolveContentSecurityPolicyEntry(twoRoots('production'), { api: 'api' })).toEqual(['api.example.com', 'api.example.org']);
    expect(resolveContentSecurityPolicyEntry(twoRoots('production'), { api: 'ws', service: 'ws', protocol: 'wss' })).toEqual([
      'wss://ws.ws.example.com',
      'wss://ws.ws.example.org',
    ]);
  });
});

describe('cors defaults', () => {
  it('scopes to every root plus a subdomain wildcard', () => {
    expect(resolveServiceScopedCorsAllowedOrigins(twoRoots('production'))).toEqual([
      'https://example.com',
      'https://*.example.com',
      'https://example.org',
      'https://*.example.org',
    ]);
    expect(resolveServiceScopedCorsAllowedOrigins(twoRoots(), ['https://x.com'])).toEqual(['https://x.com']);
    expect(resolveServiceScopedCorsAllowedOrigins(buildTestQpqConfig())).toEqual(['*']);
  });

  it('honours an explicit storage drive cors setting for that drive only', () => {
    const config = buildTestQpqConfig([defineDns('example.com'), defineStorageDriveCorsSettings('uploads', ['https://x.com'])], {
      environment: 'production',
    });
    expect(getStorageDriveCorsAllowedOrigins(config, 'uploads')).toEqual(['https://x.com']);
    expect(getStorageDriveCorsAllowedOrigins(config, 'other')).toEqual(['https://example.com', 'https://*.example.com']);
  });
});
