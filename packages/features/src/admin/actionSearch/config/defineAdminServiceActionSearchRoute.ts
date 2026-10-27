import { HTTPMethod } from 'quidproquo-core';
import { ApiKeyReference } from 'quidproquo-webserver';
import { defineRoute, GenericRouteOptions } from 'quidproquo-webserver';

import { getFeatureEntryQpqFunctionRuntime } from '../../../getFeatureEntryQpqFunctionRuntime';

export const defineAdminServiceActionSearchRoute = (
  method: HTTPMethod,
  urlPath: string,
  methodName: string,
  options: GenericRouteOptions<ApiKeyReference | string> = {},
) => {
  const qpqRuntime = getFeatureEntryQpqFunctionRuntime('admin/actionSearch', 'controller', `actionSearchController::${methodName}`);

  return defineRoute(method, urlPath, qpqRuntime, options);
};
