import { HTTPMethod } from '@qpqjs/core';
import { ApiKeyReference } from '@qpqjs/webserver';
import { defineRoute, GenericRouteOptions } from '@qpqjs/webserver';

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
