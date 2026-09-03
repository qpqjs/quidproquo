import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { CacheSettings } from '../config/QPQConfig';
import { defineApi } from '../config/settings/api';
import { defineApiKey } from '../config/settings/apiKey';
import { defineCache } from '../config/settings/cache';
import { defineCertificate } from '../config/settings/certificate';
import { defineDefaultRouteOptions } from '../config/settings/defaultRouteOptions';
import { defineDns } from '../config/settings/dns';
import { defineFileUploadSettings } from '../config/settings/fileUploadSettings';
import { defineRoute } from '../config/settings/route';
import { defineSeo } from '../config/settings/seo';
import { defineServiceFunction } from '../config/settings/serviceFunction';
import { defineStorageDriveCorsSettings } from '../config/settings/storageDriveCorsSettings';
import { defineSubdomainRedirect } from '../config/settings/subdomainRedirect';
import { defineWebEntry, WebDomainOptions } from '../config/settings/webEntry';
import { defineWebsocket } from '../config/settings/websocket';
import {
  constructEnvironmentDomainName,
  constructServiceDomainName,
  defaultFileUploadSettings,
  getAllApiKeyConfigs,
  getAllOwnedCacheConfigs,
  getAllOwnedCertifcateConfigs,
  getAllRoutes,
  getAllRoutesForApi,
  getAllSeo,
  getAllServiceFunctions,
  getAllSrcEntries,
  getApiConfigs,
  getBaseDomainName,
  getCacheConfigByName,
  getDefaultRouteSettings,
  getDnsConfigs,
  getDomainName,
  getDomainProxyConfigs,
  getDomainRoot,
  getEnvironmentDomainName,
  getFileUploadSettings,
  getOwnedServiceFunctions,
  getOwnedWebsocketSettings,
  getServiceDomainName,
  getStorageDriveCorsAllowedOrigins,
  getSubdomainRedirects,
  getWebEntry,
  getWebEntryConfigs,
  getWebsocketEntryByApiName,
  getWebsocketSettings,
  isStorageDriveWebEntryOrigin,
  resolveApexDomainNameFromDomainConfig,
  resolveDomainRoot,
  resolveServiceScopedCorsAllowedOrigins,
} from './qpqConfigAccessorsUtils';

const cacheSettings: CacheSettings = { minTTLInSeconds: 1, maxTTLInSeconds: 100, defaultTTLInSeconds: 10, mustRevalidate: false };
const webDomain: WebDomainOptions = { rootDomain: 'example.com', onRootDomain: true };

describe('config setting selectors', () => {
  it('reads routes, api keys, seo, service functions and apis', () => {
    const config = buildTestQpqConfig([
      defineRoute('GET', '/orders', '/src/orders::get'),
      defineApiKey('primary'),
      defineSeo('/home', '/src/seo::home'),
      defineServiceFunction('/src/fn::charge'),
      defineApi('orders', 'example.com'),
    ]);

    expect(getAllRoutes(config)).toHaveLength(1);
    expect(getAllRoutesForApi('orders', config)).toHaveLength(1);
    expect(getAllApiKeyConfigs(config)).toHaveLength(1);
    expect(getAllSeo(config)).toHaveLength(1);
    expect(getAllServiceFunctions(config)).toHaveLength(1);
    expect(getApiConfigs(config)).toHaveLength(1);
  });

  it('collects every buildable src entry', () => {
    const config = buildTestQpqConfig([
      defineRoute('GET', '/orders', '/src/orders::get'),
      defineSeo('/home', '/src/seo::home'),
      defineServiceFunction('/src/fn::charge'),
      defineWebsocket('api', 'example.com', { onConnect: '/src/ws::onConnect' }, { owner: { module: 'test-module' } }),
    ]);

    expect(getAllSrcEntries(config)).toEqual(['/src/orders::get', '/src/seo::home', '/src/fn::charge', '/src/ws::onConnect']);
  });
});

describe('getDomainName', () => {
  it('returns the dns base', () => {
    expect(getDomainName(buildTestQpqConfig([defineDns('example.com')]))).toBe('example.com');
  });

  it('returns an empty string when no dns is configured', () => {
    expect(getDomainName(buildTestQpqConfig())).toBe('');
  });
});

describe('getWebEntry', () => {
  it('returns the build path', () => {
    const config = buildTestQpqConfig([defineWebEntry('site', { domain: webDomain, buildPath: './dist' })]);
    expect(getWebEntry(config)).toBe('./dist');
  });

  it('throws when no web entry build path is configured', () => {
    expect(() => getWebEntry(buildTestQpqConfig())).toThrow('please use defineWebEntry');
  });
});

describe('websocket selectors', () => {
  const config = buildTestQpqConfig([defineWebsocket('api', 'example.com', {}, { apiName: 'realtime' })]);

  it('returns all websocket settings', () => {
    expect(getWebsocketSettings(config)).toHaveLength(1);
  });

  it('finds a websocket by api name', () => {
    expect(getWebsocketEntryByApiName('realtime', config).apiName).toBe('realtime');
  });

  it('throws when no websocket matches the api name', () => {
    expect(() => getWebsocketEntryByApiName('missing', config)).toThrow('No websocket setting found');
  });
});

describe('getCacheConfigByName', () => {
  const config = buildTestQpqConfig([defineCache('cdn', cacheSettings)]);

  it('finds a cache config by name', () => {
    expect(getCacheConfigByName('cdn', config).name).toBe('cdn');
  });

  it('throws when no cache config matches', () => {
    expect(() => getCacheConfigByName('missing', config)).toThrow('No cache config found');
  });
});

describe('domain name helpers', () => {
  it('keeps the apex domain in production and prefixes it otherwise', () => {
    const dns = [defineDns('example.com')];
    expect(getEnvironmentDomainName(buildTestQpqConfig(dns, { environment: 'production' }))).toBe('example.com');
    expect(getEnvironmentDomainName(buildTestQpqConfig(dns, { environment: 'staging' }))).toBe('staging.example.com');
  });

  it('prefixes the feature onto the base domain', () => {
    const config = buildTestQpqConfig([defineDns('example.com')], { environment: 'production', feature: 'beta' });
    expect(getBaseDomainName(config)).toBe('beta.example.com');
  });

  it('prefixes the service onto the base domain', () => {
    const config = buildTestQpqConfig([defineDns('example.com')], { environment: 'production', moduleName: 'orders' });
    expect(getServiceDomainName(config)).toBe('orders.example.com');
  });

  it('builds a domain root respecting environment and feature', () => {
    expect(getDomainRoot('example.com', 'production')).toBe('example.com');
    expect(getDomainRoot('example.com', 'staging', 'beta')).toBe('beta.staging.example.com');
  });

  it('constructs a service domain name', () => {
    expect(constructServiceDomainName('example.com', 'production', 'orders')).toBe('orders.example.com');
  });

  it('constructs an environment domain name', () => {
    expect(constructEnvironmentDomainName('production', 'example.com')).toBe('example.com');
    expect(constructEnvironmentDomainName('staging', 'example.com')).toBe('staging.example.com');
  });

  it('resolves the apex domain from a domain config', () => {
    const config = buildTestQpqConfig([], { environment: 'production', moduleName: 'orders' });
    expect(resolveApexDomainNameFromDomainConfig(config, 'example.com', true)).toBe('example.com');
    expect(resolveApexDomainNameFromDomainConfig(config, 'example.com', false)).toBe('orders.example.com');
  });

  it('resolves the domain root from the application module', () => {
    const config = buildTestQpqConfig([], { environment: 'staging' });
    expect(resolveDomainRoot('example.com', config)).toBe('staging.example.com');
  });
});

describe('resolveServiceScopedCorsAllowedOrigins', () => {
  it('returns explicit origins untouched', () => {
    const config = buildTestQpqConfig([defineDns('example.com')], { environment: 'production' });
    expect(resolveServiceScopedCorsAllowedOrigins(config, ['https://app.other.com'])).toEqual(['https://app.other.com']);
  });

  it('scopes to the service domain (apex + subdomain wildcard) when unset', () => {
    const config = buildTestQpqConfig([defineDns('example.com')], { environment: 'production' });
    expect(resolveServiceScopedCorsAllowedOrigins(config)).toEqual(['https://example.com', 'https://*.example.com']);
  });

  it('falls back to wildcard when the service declares no domain', () => {
    expect(resolveServiceScopedCorsAllowedOrigins(buildTestQpqConfig())).toEqual(['*']);
  });
});

describe('getStorageDriveCorsAllowedOrigins', () => {
  it('scopes to the service domain (apex + subdomain wildcard) when no cors setting is declared', () => {
    const config = buildTestQpqConfig([defineDns('example.com')], { environment: 'production' });
    expect(getStorageDriveCorsAllowedOrigins(config, 'uploads')).toEqual(['https://example.com', 'https://*.example.com']);
  });

  it('honours an explicit defineStorageDriveCorsSettings for the matching drive', () => {
    const config = buildTestQpqConfig([defineDns('example.com'), defineStorageDriveCorsSettings('uploads', ['https://app.other.com'])], {
      environment: 'production',
    });
    expect(getStorageDriveCorsAllowedOrigins(config, 'uploads')).toEqual(['https://app.other.com']);
  });

  it('ignores cors settings declared for a different drive', () => {
    const config = buildTestQpqConfig([defineDns('example.com'), defineStorageDriveCorsSettings('other', ['https://app.other.com'])], {
      environment: 'production',
    });
    expect(getStorageDriveCorsAllowedOrigins(config, 'uploads')).toEqual(['https://example.com', 'https://*.example.com']);
  });

  it('falls back to wildcard when the service declares no domain', () => {
    const config = buildTestQpqConfig();
    expect(getStorageDriveCorsAllowedOrigins(config, 'uploads')).toEqual(['*']);
  });
});

describe('isStorageDriveWebEntryOrigin', () => {
  it('is true when a web entry sources its assets from the drive', () => {
    const config = buildTestQpqConfig([
      defineWebEntry('site', { domain: webDomain, storageDrive: { sourceStorageDrive: 'uploads', autoUpload: false } }),
    ]);
    expect(isStorageDriveWebEntryOrigin(config, 'uploads')).toBe(true);
  });

  it('is false for drives no web entry consumes', () => {
    const config = buildTestQpqConfig([
      defineWebEntry('site', { domain: webDomain, storageDrive: { sourceStorageDrive: 'other', autoUpload: false } }),
    ]);
    expect(isStorageDriveWebEntryOrigin(config, 'uploads')).toBe(false);
  });

  it('is false when web entries own their bucket (no sourceStorageDrive)', () => {
    const config = buildTestQpqConfig([defineWebEntry('site', { domain: webDomain })]);
    expect(isStorageDriveWebEntryOrigin(config, 'uploads')).toBe(false);
  });

  it('is false when the service has no web entries at all', () => {
    expect(isStorageDriveWebEntryOrigin(buildTestQpqConfig(), 'uploads')).toBe(false);
  });
});

describe('getFileUploadSettings', () => {
  it('returns the defaults when no setting is declared', () => {
    const config = buildTestQpqConfig();
    expect(getFileUploadSettings(config)).toEqual(defaultFileUploadSettings);
  });

  it('merges declared overrides over the defaults', () => {
    const config = buildTestQpqConfig([defineFileUploadSettings({ maxFileCount: 2, allowedMimeTypes: ['image/*'] })]);

    expect(getFileUploadSettings(config)).toEqual({
      ...defaultFileUploadSettings,
      maxFileCount: 2,
      allowedMimeTypes: ['image/*'],
    });
  });

  it('ignores explicitly undefined overrides', () => {
    const config = buildTestQpqConfig([defineFileUploadSettings({ maxFileSizeBytes: undefined, maxFieldCount: 7 })]);

    expect(getFileUploadSettings(config)).toEqual({
      ...defaultFileUploadSettings,
      maxFieldCount: 7,
    });
  });
});

describe('getDefaultRouteSettings', () => {
  it('returns the configured default route settings', () => {
    const config = buildTestQpqConfig([defineDefaultRouteOptions('default', {})]);
    expect(getDefaultRouteSettings(config)).toHaveLength(1);
  });
});

describe('certificate ownership selectors', () => {
  it('does not throw building a certificate config', () => {
    const config = buildTestQpqConfig([defineCertificate(true, 'example.com')]);
    expect(getDomainName(config)).toBe('');
  });
});

describe('getAllSeo with subdomain redirects present', () => {
  it('ignores unrelated settings', () => {
    const config = buildTestQpqConfig([defineSubdomainRedirect('www', './build', 'https://example.com')]);
    expect(getAllSeo(config)).toEqual([]);
  });
});

describe('list and ownership selectors', () => {
  const config = buildTestQpqConfig([
    defineDns('example.com'),
    defineSubdomainRedirect('www', './build', 'https://example.com'),
    defineWebEntry('site', { domain: webDomain, buildPath: './dist' }),
    defineCache('cdn', cacheSettings, { owner: { module: 'test-module', cacheName: 'cdn' } }),
    defineCertificate(true, 'example.com'),
    defineServiceFunction('/src/fn::charge', { owner: { module: 'test-module', functionName: 'charge' } }),
    defineWebsocket('api', 'example.com', {}, { owner: { module: 'test-module' } }),
  ]);

  it('returns each list selector', () => {
    expect(getDnsConfigs(config)).toHaveLength(1);
    expect(getWebEntryConfigs(config)).toHaveLength(1);
    expect(getDomainProxyConfigs(config)).toEqual([]);
    expect(getSubdomainRedirects(config)).toHaveLength(1);
  });

  it('returns owned resources for the deploying module', () => {
    expect(getOwnedServiceFunctions(config)).toHaveLength(1);
    expect(getOwnedWebsocketSettings(config)).toHaveLength(1);
    expect(getAllOwnedCacheConfigs(config)).toHaveLength(1);
    expect(getAllOwnedCertifcateConfigs(config)).toHaveLength(1);
  });
});
