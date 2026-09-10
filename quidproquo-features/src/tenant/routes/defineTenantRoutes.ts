import { HTTPMethod, QPQConfig, QpqFunctionRuntimeAdvanced } from 'quidproquo-core';
import { RouteOptions } from 'quidproquo-webserver';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import { buildEventDocStore } from '../../eventDoc/context/buildEventDocStore';
import { buildEventDocStoreGlobals } from '../../eventDoc/globals/buildEventDocStoreGlobals';
import { defineVersionedRoute } from '../../routes/defineVersionedRoute';
import { DEFAULT_TENANT_HEADER_NAME, TENANT_HEADER_NAME_GLOBAL } from '../constants/tenantGlobalNames';
import { TENANT_DOC_TYPE, TENANT_EVENTDOC_STORE, TENANT_ON_PUBLISH_FN, TENANT_SCOPE_RESOLVER_FN } from '../constants/tenantStoreNames';
import { TenantRoutesOptions } from '../types/TenantRoutesOptions';

// The membership-gated tenant routes (list mine / create / get-record / get-logo /
// list, add and remove members), mounted at myTenantsBasePath. Every one of them keys off the caller's membership,
// so they are a different surface from the tenant collection itself - the stock
// eventDoc CRUD (append SET_BRAND, publish, audit history) that defineTenant mounts
// at basePath. The store carries the STANDARD scope resolver so create/list run
// under the request's scope like every other route - a new tenant doc lands in the
// caller's current partition (personal, or the active tenant), nowhere special.
export const defineTenantRoutes = ({ myTenantsBasePath, routeAuthSettings, version, tenantHeaderName }: TenantRoutesOptions): QPQConfig => {
  const store = buildEventDocStore({
    storeName: TENANT_EVENTDOC_STORE,
    type: TENANT_DOC_TYPE,
    onPublish: TENANT_ON_PUBLISH_FN,
    scopeResolver: TENANT_SCOPE_RESOLVER_FN,
  });

  const globals: Record<string, unknown> = {
    ...buildEventDocStoreGlobals(store),
    [EVENT_DOC_USER_DIRECTORY_GLOBAL]: routeAuthSettings.userDirectoryName,
    [TENANT_HEADER_NAME_GLOBAL]: tenantHeaderName ?? DEFAULT_TENANT_HEADER_NAME,
  };

  const options: RouteOptions = { routeAuthSettings };

  const runtime = (functionName: string): QpqFunctionRuntimeAdvanced => ({
    basePath: __dirname,
    relativePath: `./controllers/${functionName}`,
    functionName,
    globals,
  });

  const route = (method: HTTPMethod, path: string, functionName: string): QPQConfig =>
    defineVersionedRoute(method, path, runtime(functionName), options, version);

  return [
    route('GET', myTenantsBasePath, 'list'),
    route('POST', myTenantsBasePath, 'create'),
    route('GET', `${myTenantsBasePath}/{id}`, 'get'),
    route('GET', `${myTenantsBasePath}/{id}/logo`, 'getLogo'),
    route('GET', `${myTenantsBasePath}/{id}/members`, 'listMembers'),
    route('POST', `${myTenantsBasePath}/{id}/members`, 'addMember'),
    route('DELETE', `${myTenantsBasePath}/{id}/members/{userId}`, 'removeMember'),
  ];
};
