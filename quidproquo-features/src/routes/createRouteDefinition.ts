import { HTTPMethod } from 'quidproquo-core';
import { RouteOptions } from 'quidproquo-webserver';

import { dynamicRoute, DynamicRouteHandler, DynamicRouteRuntime } from './dynamicRoute';
import { DynamicRouteConfig } from './DynamicRouteConfig';
import { DynamicRouteKnownErrors } from './DynamicRouteKnownErrors';

// A dynamicRoute with its RouteOptions already baked in. Callers only supply the
// method/path/version, so the options position drops off the settings tuple.
export type RouteDefinition = <S extends string, TBody = undefined, TQuery = undefined>(
  settings: [HTTPMethod, S] | [HTTPMethod, S, number],
  runtime: DynamicRouteRuntime<S, TBody, TQuery>,
  config?: DynamicRouteConfig<TBody, TQuery>,
) => DynamicRouteHandler<S>;

// Stamp out a route family that shares RouteOptions (auth settings, cors, etc.)
// and a common set of known-error mappings. Both are closured in; per-route
// knownErrors are merged on top of commonKnownErrors and win on conflict:
//
//   const usersRoute = createRouteDefinition(
//     { routeAuthSettings: { userDirectoryName: 'users' } },
//     { [SomeErrorEnum.NotAuthenticated]: 401 },
//   );
//   export const getMe = usersRoute(['GET', '/me'], function* (event) { ... });
//   export const rename = usersRoute(['POST', '/me/name'], function* (event, params, { body }) { ... }, {
//     schema: { body: z.object({ name: z.string().min(1) }) },
//   });
export const createRouteDefinition = (options: RouteOptions = {}, commonKnownErrors: DynamicRouteKnownErrors = {}): RouteDefinition => {
  return <S extends string, TBody = undefined, TQuery = undefined>(
    settings: [HTTPMethod, S] | [HTTPMethod, S, number],
    runtime: DynamicRouteRuntime<S, TBody, TQuery>,
    config: DynamicRouteConfig<TBody, TQuery> = {},
  ): DynamicRouteHandler<S> => {
    const [method, path, version] = settings;

    return dynamicRoute<S, TBody, TQuery>([method, path, version ?? 1, options], runtime, {
      ...config,
      knownErrors: { ...commonKnownErrors, ...config.knownErrors },
    });
  };
};
