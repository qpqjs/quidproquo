import { HTTPMethod, QpqFunctionRuntime } from 'quidproquo-core';
import { defineRoute, RouteOptions } from 'quidproquo-webserver';

export const defineVersionedRoute = (method: HTTPMethod, path: string, runtime: QpqFunctionRuntime, options: RouteOptions = {}, version = 1) => [
  defineRoute(method, `/v${version}${path}`, runtime, options),
];
