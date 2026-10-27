import { HTTPMethod, QpqFunctionRuntime } from 'quidproquo-core';
import { ApiKeyReference } from 'quidproquo-webserver';
import { defineRoute, GenericRouteOptions } from 'quidproquo-webserver';

import { getFeatureEntryQpqFunctionRuntime } from '../../../getFeatureEntryQpqFunctionRuntime';

export const defineAdminServiceLogLogRoute = (
  method: HTTPMethod,
  urlPath: string,
  methodName: string,
  options: GenericRouteOptions<ApiKeyReference | string> = {},
) => {
  const qpqRuntime = getFeatureEntryQpqFunctionRuntime('admin/log', 'controller', `logLogController::${methodName}`);

  return defineRoute(method, urlPath, qpqRuntime, options);
};
