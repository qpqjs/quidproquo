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
import { defineSubdomainRedirect } from '../config/settings/subdomainRedirect';
import { defineWebEntry, WebDomainOptions } from '../config/settings/webEntry';
import { defineWebsocket } from '../config/settings/websocket';
import {
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
  getCacheConfigByName,
  getDefaultRouteSettings,
  getDomainProxyConfigs,
  getFileUploadSettings,
  getOwnedServiceFunctions,
  getOwnedWebsocketSettings,
  getSubdomainRedirects,
  getWebEntry,
  getWebEntryConfigs,
  getWebsocketEntryByApiName,
  getWebsocketSettings,
  isStorageDriveWebEntryOrigin,
} from './qpqConfigAccessorsUtils';

const cacheSettings: CacheSettings = { minTTLInSeconds: 1, maxTTLInSeconds: 100, defaultTTLInSeconds: 10, mustRevalidate: false };
const webDomain: WebDomainOptions = { onRootDomain: true };

describe('config setting selectors', () => {
  it('reads routes, api keys, seo, service functions and apis', () => {
    const config = buildTestQpqConfig([
      defineRoute('GET', '/orders', '/src/orders::get'),
      defineApiKey('primary'),
      defineSeo('/home', '/src/seo::home'),
      defineServiceFunction('/src/fn::charge'),
      defineApi('orders'),
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
      defineWebsocket('api', { onConnect: '/src/ws::onConnect' }, { owner: { module: 'test-module' } }),
    ]);

    expect(getAllSrcEntries(config)).toEqual(['/src/orders::get', '/src/seo::home', '/src/fn::charge', '/src/ws::onConnect']);
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
  const config = buildTestQpqConfig([defineWebsocket('api', {}, { apiName: 'realtime' })]);

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
    expect(getAllOwnedCertifcateConfigs(config)).toHaveLength(1);
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
    defineWebsocket('api', {}, { owner: { module: 'test-module' } }),
  ]);

  it('returns each list selector', () => {
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
