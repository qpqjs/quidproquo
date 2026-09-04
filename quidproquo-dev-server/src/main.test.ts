import { buildTestQpqConfig, defineGlobal } from 'quidproquo-core';
import { defineDns, qpqWebServerUtils } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { getDevConfigs, resolveDevServerConfig } from './main';
import { DevServerConfig } from './types';

describe('getDevConfigs', () => {
  it('returns the base configs unchanged when no overrides are given', () => {
    const config = buildTestQpqConfig();

    const [result] = getDevConfigs([config]);

    expect(result).toEqual(config);
  });

  it('appends all-service overrides to every config', () => {
    const override = defineGlobal('region', 'us-east-1');

    const [result] = getDevConfigs([buildTestQpqConfig()], { allServices: [override] });

    expect(result).toContainEqual(override);
  });

  it('appends service-specific overrides only to the matching module', () => {
    const override = defineGlobal('region', 'eu-west-1');
    const configA = buildTestQpqConfig([], { moduleName: 'svc-a' });
    const configB = buildTestQpqConfig([], { moduleName: 'svc-b' });

    const [resultA, resultB] = getDevConfigs([configA, configB], { byService: { 'svc-a': [override] } });

    expect(resultA).toContainEqual(override);
    expect(resultB).not.toContainEqual(override);
  });
});

describe('resolveDevServerConfig', () => {
  it('localises every config once so all plugins, not just the api, see the dev origin', () => {
    const devServerConfig = {
      serverDomain: 'localhost',
      serverPort: 8080,
      dynamicModuleLoader: async () => null,
      qpqConfigs: [buildTestQpqConfig([defineDns('quidproquojs.com')])],
    } as unknown as DevServerConfig;

    const resolved = resolveDevServerConfig(devServerConfig);

    const [dns] = qpqWebServerUtils.getDnsConfigs(resolved.qpqConfigs[0]);
    expect(dns.dnsBase).toBe('localhost:8080');

    // The caller's configs are left alone; the localised ones are a copy
    const [originalDns] = qpqWebServerUtils.getDnsConfigs(devServerConfig.qpqConfigs[0]);
    expect(originalDns.dnsBase).toBe('quidproquojs.com');
  });
});
