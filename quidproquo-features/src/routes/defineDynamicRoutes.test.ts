import { qpqCoreUtils } from 'quidproquo-core';
import { HTTPEventResponse, qpqWebServerUtils, RouteQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { defineDynamicRoutes } from './defineDynamicRoutes';
import { dynamicRoute } from './dynamicRoute';

const ok = (): HTTPEventResponse => qpqWebServerUtils.toJsonEventResponse({});

describe('defineDynamicRoutes', () => {
  it('accepts handlers with typed path params and points each at the controller export', () => {
    const controllers = {
      list: dynamicRoute(['GET', '/widgets'], function* () {
        return ok();
      }),
      get: dynamicRoute(['GET', '/widgets/{id}', 2], function* (_event, params: { id: string }) {
        return ok();
      }),
    };

    const routes = qpqCoreUtils.flattenQpqConfig(defineDynamicRoutes(controllers, '/widgets/controller')) as RouteQPQWebServerConfigSetting[];

    expect(routes.map((route) => [route.method, route.path, route.runtime])).toEqual([
      ['GET', '/v1/widgets', '/widgets/controller::list'],
      ['GET', '/v2/widgets/{id}', '/widgets/controller::get'],
    ]);
  });

  it('rejects an export that is not a dynamic route', () => {
    const notARoute = { dynamicRoute: undefined } as unknown as ReturnType<typeof dynamicRoute>;

    expect(() => defineDynamicRoutes({ notARoute })).toThrow('Route not defined for notARoute');
  });
});
