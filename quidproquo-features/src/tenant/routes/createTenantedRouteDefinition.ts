import { AskResponse, HTTPMethod } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, RouteOptions } from 'quidproquo-webserver';

import {
  createRouteDefinition,
  DynamicRouteConfig,
  DynamicRouteHandler,
  DynamicRouteInput,
  DynamicRouteKnownErrors,
  DynamicRouteRuntime,
  ExtractRouteParams,
  RouteDefinition,
} from '../../routes';
import { askTenantProvideRequestScope } from '../logic';

// Like createRouteDefinition, but every handler runs inside the request's typed
// storage scope. The userDirectoryName is used twice: the gateway authenticates
// the JWT against it (routeAuthSettings), and askTenantProvideRequestScope
// resolves the tenant header against it (membership-checked, Forbidden on no
// access) then runs the handler under that scope. No header = the caller's own
// personal scope - handlers NEVER run unscoped, so one user's personal data is
// never visible to another. Handlers no longer wrap themselves with
// askTenantProvideRequestScope.
export const createTenantedRouteDefinition = (
  userDirectoryName: string,
  options: RouteOptions = {},
  commonKnownErrors: DynamicRouteKnownErrors = {},
): RouteDefinition => {
  const tenantedOptions: RouteOptions = {
    ...options,
    routeAuthSettings: {
      ...options.routeAuthSettings,
      userDirectoryName,
    },
  };

  const routeDefinition = createRouteDefinition(tenantedOptions, commonKnownErrors);

  return <S extends string, TBody = undefined, TQuery = undefined>(
    settings: [HTTPMethod, S] | [HTTPMethod, S, number],
    runtime: DynamicRouteRuntime<S, TBody, TQuery>,
    config?: DynamicRouteConfig<TBody, TQuery>,
  ): DynamicRouteHandler<S> => {
    // Scope the whole handler to the request's tenant (and gate membership) before it runs.
    const scopedRuntime = (
      event: HTTPEvent,
      params: ExtractRouteParams<S>,
      input: DynamicRouteInput<TBody, TQuery>,
    ): AskResponse<HTTPEventResponse> => askTenantProvideRequestScope(event, userDirectoryName, runtime(event, params, input));

    return routeDefinition<S, TBody, TQuery>(settings, scopedRuntime, config);
  };
};
