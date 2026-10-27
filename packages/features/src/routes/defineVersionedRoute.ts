import { HTTPMethod, QpqFunctionRuntime } from '@qpqjs/core';
import { defineRoute, RouteOptions } from '@qpqjs/webserver';

export const defineVersionedRoute = (method: HTTPMethod, path: string, runtime: QpqFunctionRuntime, options: RouteOptions = {}, version = 1) => [
  defineRoute(method, `/v${version}${path}`, runtime, options),
];
