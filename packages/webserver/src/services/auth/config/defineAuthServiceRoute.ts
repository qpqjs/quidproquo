import { HTTPMethod, QpqFunctionRuntime } from 'quidproquo-core';

import { ApiKeyReference } from '../../../config/settings/apiKey';
import { defineRoute, GenericRouteOptions } from '../../../config/settings/route';
import { getServiceEntryQpqFunctionRuntime } from '../../getServiceEntryQpqFunctionRuntime';

export const defineAuthServiceRoute = (
  method: HTTPMethod,
  urlPath: string,
  methodName: string,
  options: GenericRouteOptions<ApiKeyReference | string> = {},
) => {
  const qpqRuntime: QpqFunctionRuntime = getServiceEntryQpqFunctionRuntime('auth', 'controller', `authController::${methodName}`);

  return defineRoute(method, urlPath, qpqRuntime, options);
};
