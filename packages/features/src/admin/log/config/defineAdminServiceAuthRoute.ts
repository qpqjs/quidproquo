import { HTTPMethod, QpqFunctionRuntime } from '@qpqjs/core';
import { ApiKeyReference } from '@qpqjs/webserver';
import { defineRoute, GenericRouteOptions } from '@qpqjs/webserver';

import { getFeatureEntryQpqFunctionRuntime } from '../../../getFeatureEntryQpqFunctionRuntime';

export const defineAdminServiceAuthRoute = (
  method: HTTPMethod,
  urlPath: string,
  methodName: string,
  options: GenericRouteOptions<ApiKeyReference | string> = {},
) => {
  const qpqRuntime: QpqFunctionRuntime = getFeatureEntryQpqFunctionRuntime('admin/log', 'controller', `loginController::${methodName}`);

  return defineRoute(method, urlPath, qpqRuntime, options);
};
