import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineApi } from '../../../config/settings/api';
import { defineDns } from '../../../config/settings/dns';
import { defineStorageDriveCorsSettings } from '../../../config/settings/storageDriveCorsSettings';
import { getDnsConfig } from '../../../configUtils/dns/getDnsConfig';
import { getRootDomains } from '../../../configUtils/dns/getRootDomains';
import { defaultDomainResolver } from '../../../domain/resolvers/defaultDomainResolver';
import { DomainResolver } from '../../../domain/types/DomainResolver';
import { getStorageDriveCorsAllowedOrigins } from '../origin/getStorageDriveCorsAllowedOrigins';
import { resolveContentSecurityPolicyEntry } from '../origin/resolveContentSecurityPolicyEntry';
import { resolveOrigins } from '../origin/resolveOrigins';
import { resolveServiceScopedCorsAllowedOrigins } from '../origin/resolveServiceScopedCorsAllowedOrigins';
import { getDomainResolver } from '../resolver/getDomainResolver';
import { loadDomainResolver } from '../resolver/loadDomainResolver';
import { findRootDomainForHost } from './findRootDomainForHost';
import { resolveHostForRequestHost } from './resolveHostForRequestHost';
import { resolveHostForRoot } from './resolveHostForRoot';
import { resolveHosts } from './resolveHosts';
import { resolvePrimaryHost } from './resolvePrimaryHost';

// The infra-team shape: `dev-api.example.com`, `dev-ws-ws.example.com`, `example.com` in prod.
const hyphenated: DomainResolver = {
  resolveHost: ({ rootDomain, environment, feature, service, subdomain }) => {
    const label = [feature, environment === 'production' ? undefined : environment, subdomain, service].filter(Boolean).join('-');
    return label ? `${label}.${rootDomain}` : rootDomain;
  },
};

const twoRoots = (environment = 'development') => buildTestQpqConfig([defineDns(['example.com', 'example.org'])], { environment });

describe('getDnsConfig / getRootDomains', () => {
  it('returns null and no roots without a dns setting', () => {
    expect(getDnsConfig(buildTestQpqConfig())).toBeNull();
    expect(getRootDomains(buildTestQpqConfig())).toEqual([]);
  });

  it('throws on a second dns setting', () => {
    expect(() => getDnsConfig(buildTestQpqConfig([defineDns('a.com'), defineDns('b.com')]))).toThrow('once per service');
  });
});

describe('resolveHosts', () => {
  it('is empty without a domain', () => {
    expect(resolveHosts(buildTestQpqConfig(), {})).toEqual([]);
  });

  it('resolves one host per root, primary first, with the default shape', () => {
    expect(resolveHosts(twoRoots(), { subdomain: 'api' })).toEqual(['api.development.example.com', 'api.development.example.org']);
  });

  it('runs the resolver it is given', () => {
    const config = buildTestQpqConfig([defineDns(['example.com'])], { environment: 'development', feature: 'joe' });
    expect(resolveHosts(config, { subdomain: 'ws', service: 'ws' }, hyphenated)).toEqual(['joe-development-ws-ws.example.com']);
    expect(resolveHosts(buildTestQpqConfig([defineDns('example.com')], { environment: 'production' }), {}, hyphenated)).toEqual(['example.com']);
  });

  it('rejects a host outside the root', () => {
    const rogue: DomainResolver = { resolveHost: () => 'other.com' };
    expect(() => resolveHosts(twoRoots(), {}, rogue)).toThrow('must be the root or end with .example.com');
  });

  it('loads the pointer through the dynamic module loader, built-ins otherwise', async () => {
    const pointer = { basePath: '/app', relativePath: 'domainResolver', functionName: 'domainResolver' };
    const config = buildTestQpqConfig([defineDns('example.com', { resolver: pointer })]);
    const loader = async (runtime: unknown) => (runtime === pointer ? hyphenated : null);

    expect(await loadDomainResolver(config, loader)).toBe(hyphenated);
    expect(await loadDomainResolver(twoRoots(), async () => null)).toBe(defaultDomainResolver);
    await expect(loadDomainResolver(config, async () => null)).rejects.toThrow('must be a DomainResolver');
  });
});

describe('resolvePrimaryHost / resolveHostForRoot', () => {
  it('returns the primary and throws without a domain', () => {
    expect(resolvePrimaryHost(twoRoots('production'), {})).toBe('example.com');
    expect(() => resolvePrimaryHost(buildTestQpqConfig(), {})).toThrow('declares no domain');
  });

  it('picks the host for a specific root', () => {
    expect(resolveHostForRoot(twoRoots('production'), 'example.org', { subdomain: 'api' })).toBe('api.example.org');
    expect(() => resolveHostForRoot(twoRoots(), 'other.com', {})).toThrow('not declared');
  });
});

describe('resolveHostForRequestHost', () => {
  it('answers on the root the request arrived on, primary when unknown, null without a domain', () => {
    const config = twoRoots('production');

    expect(resolveHostForRequestHost(config, 'views.example.org', { subdomain: 'api' })).toBe('api.example.org');
    expect(resolveHostForRequestHost(config, 'evil.com')).toBe('example.com');
    expect(resolveHostForRequestHost(config, undefined)).toBe('example.com');
    expect(resolveHostForRequestHost(buildTestQpqConfig(), 'example.com')).toBeNull();
  });
});

describe('findRootDomainForHost', () => {
  const config = buildTestQpqConfig([defineDns(['example.com', 'app.example.com'])]);

  it('matches the longest declared root, ignoring port and case', () => {
    expect(findRootDomainForHost(config, 'API.app.example.com:443')).toBe('app.example.com');
    expect(findRootDomainForHost(config, 'views.example.com')).toBe('example.com');
    expect(findRootDomainForHost(config, 'example.com')).toBe('example.com');
  });

  it('is null for a host under no declared root', () => {
    expect(findRootDomainForHost(config, 'notexample.com')).toBeNull();
    expect(findRootDomainForHost(config, 'evil.com')).toBeNull();
  });
});
