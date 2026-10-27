import { HTTPMethod, QpqFunctionRuntime } from '@qpqjs/core';
import { ApiKeyReference } from '@qpqjs/webserver';
import { defineRoute, GenericRouteOptions } from '@qpqjs/webserver';

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
