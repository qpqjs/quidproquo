import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineDefaultRouteOptions } from '../config/settings/defaultRouteOptions';
import { RouteQPQWebServerConfigSetting } from '../config/settings/route';
import { mergeAllRouteOptions, mergeRouteAuthSettings, mergeRouteOptions } from './mergeRouteUtils';

describe('mergeRouteAuthSettings', () => {
  it('prefers the second user directory and unions scopes and api keys', () => {
    const merged = mergeRouteAuthSettings(
      { userDirectoryName: 'a', scopes: ['read'], apiKeys: [{ name: 'k1' }] },
      { userDirectoryName: 'b', scopes: ['write'], apiKeys: [{ name: 'k2' }] },
    );

    expect(merged.userDirectoryName).toBe('b');
    expect(merged.scopes).toEqual(['write', 'read']);
    expect(merged.apiKeys).toEqual([{ name: 'k2' }, { name: 'k1' }]);
  });

  it('deduplicates identical api key references', () => {
    const merged = mergeRouteAuthSettings({ apiKeys: [{ name: 'k1' }] }, { apiKeys: [{ name: 'k1' }] });

    expect(merged.apiKeys).toEqual([{ name: 'k1' }]);
  });
});

describe('mergeRouteOptions', () => {
  it('unions allowed origins and merges auth settings', () => {
    const merged = mergeRouteOptions(
      { allowedOrigins: ['https://a.com'], routeAuthSettings: { scopes: ['read'] } },
      { allowedOrigins: ['https://b.com'], routeAuthSettings: { scopes: ['write'] } },
    );

    expect(merged.allowedOrigins).toEqual(['https://b.com', 'https://a.com']);
    expect(merged.routeAuthSettings?.scopes).toEqual(['write', 'read']);
  });

  it('keeps the more specific schema and falls back to the default one', () => {
    const defaultSchema = { summary: 'default' };
    const routeSchema = { summary: 'route', bodyJsonSchema: { type: 'object' } };

    expect(mergeRouteOptions({ schema: defaultSchema }, { schema: routeSchema }).schema).toBe(routeSchema);
    expect(mergeRouteOptions({ schema: defaultSchema }, {}).schema).toBe(defaultSchema);
  });
});

describe('mergeAllRouteOptions', () => {
  it('folds the default route options into the route options', () => {
    const config = buildTestQpqConfig([defineDefaultRouteOptions('default', { allowedOrigins: ['https://default.com'] })]);
    const route = { options: { allowedOrigins: ['https://route.com'] } } as RouteQPQWebServerConfigSetting;

    const merged = mergeAllRouteOptions('api', route, config);

    expect(merged.allowedOrigins).toEqual(expect.arrayContaining(['https://default.com', 'https://route.com']));
  });
});
