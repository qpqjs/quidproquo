import { AskResponse, askStorageScopeProvide, HTTPMethod } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, RouteOptions } from 'quidproquo-webserver';

import {
  createRouteDefinition,
  DynamicRouteHandler,
  DynamicRouteInput,
  DynamicRouteKnownErrors,
  DynamicRouteRuntime,
  ExtractRouteParams,
} from '../../routes';
import { askTenantAssertRoutePermission } from '../logic/askTenantAssertRoutePermission';
import { askTenantResolveRequest } from '../logic/askTenantResolveRequest';
import { TenantRoutePermission } from '../models/TenantRoutePermission';
import { TenantedRouteConfig } from '../types/TenantedRouteConfig';

/** A RouteDefinition whose config may name the permission the route requires. */
export type TenantedRouteDefinition = <S extends string, TBody = undefined, TQuery = undefined>(
  settings: [HTTPMethod, S] | [HTTPMethod, S, number],
  runtime: DynamicRouteRuntime<S, TBody, TQuery>,
  config?: TenantedRouteConfig<TBody, TQuery>,
) => DynamicRouteHandler<S>;

// Gate, then permission, then scope, then handler. The permission is judged against the row the
// gate read, so a declared permission costs no second store read.
function* askTenantedRun<T>(
  event: HTTPEvent,
  userDirectoryName: string,
  params: Record<string, string>,
  permission: TenantRoutePermission | undefined,
  story: AskResponse<T>,
): AskResponse<T> {
  const request = yield* askTenantResolveRequest(event, userDirectoryName);

  if (permission !== undefined) {
    yield* askTenantAssertRoutePermission(permission, params, request);
  }

  return yield* askStorageScopeProvide(request.scope, story);
}

/**
 * Like createRouteDefinition, but every handler runs inside the request's typed storage scope,
 * after the membership gate and the route's declared `permission` (if any). The gateway
 * authenticates the JWT against userDirectoryName (routeAuthSettings), and the tenant header
 * is membership-checked against it. No header = the caller's own personal scope; handlers
 * NEVER run unscoped. A route with a `permission` refuses a personal-scope request unless the
 * declaration sets `allowPersonalScope`.
 */
export const createTenantedRouteDefinition = (
  userDirectoryName: string,
  options: RouteOptions = {},
  commonKnownErrors: DynamicRouteKnownErrors = {},
): TenantedRouteDefinition => {
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
    config: TenantedRouteConfig<TBody, TQuery> = {},
  ): DynamicRouteHandler<S> => {
    const { permission, ...routeConfig } = config;

    const scopedRuntime = (
      event: HTTPEvent,
      params: ExtractRouteParams<S>,
      input: DynamicRouteInput<TBody, TQuery>,
    ): AskResponse<HTTPEventResponse> => askTenantedRun(event, userDirectoryName, params, permission, runtime(event, params, input));

    return routeDefinition<S, TBody, TQuery>(settings, scopedRuntime, routeConfig);
  };
};
