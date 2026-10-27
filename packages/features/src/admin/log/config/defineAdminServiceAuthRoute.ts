import { HTTPMethod, QpqFunctionRuntime } from 'quidproquo-core';
import { ApiKeyReference } from 'quidproquo-webserver';
import { defineRoute, GenericRouteOptions } from 'quidproquo-webserver';

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
