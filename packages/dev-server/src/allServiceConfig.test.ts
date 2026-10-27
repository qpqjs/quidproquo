import { buildTestQpqConfig } from 'quidproquo-core';
import { defineApi, defineDefaultRouteOptions, defineDns, defineRoute, qpqWebServerUtils } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { getAllServiceConfigs } from './allServiceConfig';
import { DevServerConfig } from './types';

const buildDevServerConfig = (qpqConfig: any): DevServerConfig =>
  ({
    serverDomain: 'localhost',
    serverPort: 3000,
    dynamicModuleLoader: async () => null,
    qpqConfigs: [qpqConfig],
  }) as any;

describe('getAllServiceConfigs', () => {
  it('rewrites every root to the local server origin and drops the app resolver', () => {
    const resolver = { basePath: '/app', relativePath: 'domainResolver', functionName: 'domainResolver' };
    const qpqConfig = buildTestQpqConfig([defineDns(['example.com', 'example.org'], { resolver }), defineApi('api')]);

    const [result] = getAllServiceConfigs(buildDevServerConfig(qpqConfig));

    expect(qpqWebServerUtils.getRootDomains(result)).toEqual(['localhost:3000']);
    expect(qpqWebServerUtils.getDnsConfig(result)?.resolver).toBeUndefined();
    expect(qpqWebServerUtils.resolveHosts(result, { subdomain: 'api' })).toEqual(['localhost:3000']);
  });

  it('appends local and wildcard origins to routes and default route options', () => {
    const qpqConfig = buildTestQpqConfig([
      defineRoute('GET', '/users', '/entry::onGet' as any),
      defineDefaultRouteOptions('api', { allowedOrigins: ['https://existing.com'] } as any),
    ]);

    const [result] = getAllServiceConfigs(buildDevServerConfig(qpqConfig));

    const [route] = qpqWebServerUtils.getAllRoutes(result);
    expect(route.options.allowedOrigins).toContain('*');

    const [defaultRouteSetting] = qpqWebServerUtils.getDefaultRouteSettings(result);
    expect(defaultRouteSetting.routeOptions.allowedOrigins).toEqual(expect.arrayContaining(['https://existing.com', '*']));
  });

  it('does not mutate the input configs', () => {
    const qpqConfig = buildTestQpqConfig([defineRoute('GET', '/users', '/entry::onGet' as any)]);
    const [inputRoute] = qpqWebServerUtils.getAllRoutes(qpqConfig);

    getAllServiceConfigs(buildDevServerConfig(qpqConfig));

    expect(inputRoute.options.allowedOrigins).toBeUndefined();
  });
});
