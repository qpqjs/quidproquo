import { qpqCoreUtils } from 'quidproquo-core';
import { RouteQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { OPEN_API_INFO_GLOBAL } from '../constants/openApiGlobalNames';
import { defineOpenApiRoutes } from './defineOpenApiRoutes';

const flatten = (config: ReturnType<typeof defineOpenApiRoutes>): RouteQPQWebServerConfigSetting[] =>
  qpqCoreUtils.flattenQpqConfig(config) as RouteQPQWebServerConfigSetting[];

describe('defineOpenApiRoutes', () => {
  it('mounts the reference page and the document under /docs by default', () => {
    const routes = flatten(defineOpenApiRoutes());

    expect(routes.map((route) => [route.method, route.path])).toEqual([
      ['GET', '/v1/docs'],
      ['GET', '/v1/docs/openapi.json'],
    ]);
  });

  it('honours basePath and version, hides itself, and carries the info through a global', () => {
    const routes = flatten(defineOpenApiRoutes({ basePath: '/reference', version: 2, info: { title: 'Widgets' } }));

    expect(routes.map((route) => route.path)).toEqual(['/v2/reference', '/v2/reference/openapi.json']);
    for (const route of routes) {
      expect(route.options.schema).toEqual({ hidden: true });
      expect((route.runtime as { globals: Record<string, unknown> }).globals).toEqual({ [OPEN_API_INFO_GLOBAL]: { title: 'Widgets' } });
    }
  });

  it('passes auth settings on to both routes', () => {
    const routes = flatten(defineOpenApiRoutes({ routeAuthSettings: { userDirectoryName: 'admins' } }));

    for (const route of routes) {
      expect(route.options.routeAuthSettings?.userDirectoryName).toBe('admins');
    }
  });
});
