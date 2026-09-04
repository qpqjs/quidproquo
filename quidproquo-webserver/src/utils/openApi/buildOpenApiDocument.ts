import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { OpenApiDocument, OpenApiPathItem, OpenApiSecurityScheme } from '../../types/OpenApiDocument';
import { mergeAllRouteOptions } from '../mergeRouteUtils';
import { getAllRoutes, getApiConfigs, getBaseDomainName, getDomainName } from '../qpqConfigAccessorsUtils';
import { buildOpenApiOperation } from './buildOpenApiOperation';
import { openApiSecuritySchemes } from './buildOpenApiSecurity';
import { OpenApiDocumentOptions } from './OpenApiDocumentOptions';

type HttpVerb = keyof OpenApiPathItem;

// Every live api the service exposes is a server the operations can be called on.
// A service with no domain (nothing browser-facing, local only) lists none.
const buildServers = (qpqConfig: QPQConfig): { url: string }[] => {
  if (!getDomainName(qpqConfig)) {
    return [];
  }

  const baseDomain = getBaseDomainName(qpqConfig);

  return getApiConfigs(qpqConfig)
    .filter((api) => !api.deprecated)
    .map((api) => ({ url: `https://${api.apiSubdomain}.${baseDomain}` }));
};

// Only schemes some operation actually references make it into components, so a
// service with no auth publishes no dangling security definitions.
const buildSecuritySchemes = (paths: Record<string, OpenApiPathItem>): Record<string, OpenApiSecurityScheme> => {
  const used = new Set(
    Object.values(paths)
      .flatMap((pathItem) => Object.values(pathItem))
      .flatMap((operation) => operation.security ?? [])
      .flatMap((requirement) => Object.keys(requirement)),
  );

  return Object.fromEntries(Object.entries(openApiSecuritySchemes).filter(([name]) => used.has(name)));
};

// Walk every route in the config and describe it. Routes are plain data, so this
// runs anywhere the config does: at deploy time, in a processor, or in a test.
export const buildOpenApiDocument = (qpqConfig: QPQConfig, options: OpenApiDocumentOptions = {}): OpenApiDocument => {
  const paths: Record<string, OpenApiPathItem> = {};

  for (const route of getAllRoutes(qpqConfig)) {
    const routeOptions = mergeAllRouteOptions('', route, qpqConfig);
    if (routeOptions.schema?.hidden) {
      continue;
    }

    const verb = route.method.toLowerCase() as HttpVerb;
    paths[route.path] = { ...paths[route.path], [verb]: buildOpenApiOperation(route, routeOptions) };
  }

  return {
    openapi: '3.1.0',
    info: {
      title: options.title ?? `${qpqCoreUtils.getApplicationName(qpqConfig)} ${qpqCoreUtils.getApplicationModuleName(qpqConfig)}`,
      version: options.version ?? '1.0.0',
      description: options.description,
    },
    servers: buildServers(qpqConfig),
    paths,
    components: { securitySchemes: buildSecuritySchemes(paths) },
  };
};
