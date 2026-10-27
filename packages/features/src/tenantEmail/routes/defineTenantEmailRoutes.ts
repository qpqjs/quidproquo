import { HTTPMethod, QPQConfig, QpqFunctionRuntimeAdvanced } from 'quidproquo-core';
import { RouteOptions } from 'quidproquo-webserver';

import { defineVersionedRoute } from '../../routes/defineVersionedRoute';
import { TENANT_EMAIL_USER_DIRECTORY_GLOBAL } from '../constants/tenantEmailGlobalNames';
import { TenantedEmailReceiverOptions } from '../types/TenantedEmailReceiverOptions';

// The inbox routes: list, register, release. Each gates on a tenant header plus InboxesManage.
export const defineTenantEmailRoutes = ({
  basePath,
  routeAuthSettings,
  version,
}: Pick<TenantedEmailReceiverOptions, 'basePath' | 'routeAuthSettings' | 'version'>): QPQConfig => {
  const globals: Record<string, unknown> = {
    [TENANT_EMAIL_USER_DIRECTORY_GLOBAL]: routeAuthSettings.userDirectoryName,
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

  return [route('GET', basePath, 'list'), route('POST', basePath, 'create'), route('DELETE', `${basePath}/{address}`, 'remove')];
};
