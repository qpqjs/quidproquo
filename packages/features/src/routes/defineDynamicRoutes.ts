import { QPQConfig } from '@qpqjs/core';

import { defineVersionedRoute } from './defineVersionedRoute';
import { DynamicRouteMeta } from './dynamicRoute';

// Only the brand matters here. Asking for the full DynamicRouteHandler would reject
// every handler with typed path params, because their `params` argument is narrower
// than the default Record<string, string>.
type BrandedRouteHandler = { dynamicRoute: DynamicRouteMeta };

export const defineDynamicRoutes = (controllerRuntime: Record<string, BrandedRouteHandler>, path: `/${string}` = '/entry/controller'): QPQConfig =>
  Object.entries(controllerRuntime).map(([key, handler]) => {
    const route = handler.dynamicRoute;
    if (!route) {
      throw new Error(`Route not defined for ${key}`);
    }

    return defineVersionedRoute(route.method, route.path, `${path}::${key}`, route.options, route.version);
  });
