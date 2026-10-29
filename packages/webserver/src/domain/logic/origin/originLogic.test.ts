import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { defineDns } from '../../../config/settings/dns';
import { defineStorageDriveCorsSettings } from '../../../config/settings/storageDriveCorsSettings';
import { getStorageDriveCorsAllowedOrigins } from './getStorageDriveCorsAllowedOrigins';
import { resolveContentSecurityPolicyEntry } from './resolveContentSecurityPolicyEntry';
import { resolveOrigins } from './resolveOrigins';
import { resolveServiceScopedCorsAllowedOrigins } from './resolveServiceScopedCorsAllowedOrigins';

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
