import { HTTPMethod, QPQConfig, QpqFunctionRuntimeAdvanced } from 'quidproquo-core';
import { RouteOptions } from 'quidproquo-webserver';

import { defineVersionedRoute } from '../../routes/defineVersionedRoute';
import { OPEN_API_INFO_GLOBAL } from '../constants/openApiGlobalNames';
import { OpenApiRoutesOptions } from '../types/OpenApiRoutesOptions';

// Mounts the generated docs: the reference UI at basePath and the raw document at
// basePath/openapi.json. Both are hidden from the document they serve.
export const defineOpenApiRoutes = ({ basePath = '/docs', version, info = {}, routeAuthSettings }: OpenApiRoutesOptions = {}): QPQConfig => {
  const options: RouteOptions = {
    routeAuthSettings,
    schema: { hidden: true },
  };

  const runtime = (functionName: string): QpqFunctionRuntimeAdvanced => ({
    basePath: __dirname,
    relativePath: `./controllers/${functionName}`,
    functionName,
    globals: { [OPEN_API_INFO_GLOBAL]: info },
  });

  const route = (method: HTTPMethod, path: string, functionName: string): QPQConfig =>
    defineVersionedRoute(method, path, runtime(functionName), options, version);

  return [route('GET', basePath, 'reference'), route('GET', `${basePath}/openapi.json`, 'document')];
};
