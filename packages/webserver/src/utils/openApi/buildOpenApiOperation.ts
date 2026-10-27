import { RouteOptions } from '../../config/settings/route';
import { RouteQPQWebServerConfigSetting } from '../../config/settings/route';
import { OpenApiOperation, OpenApiResponse } from '../../types/OpenApiDocument';
import { buildOpenApiPathParameters } from './buildOpenApiPathParameters';
import { buildOpenApiQueryParameters } from './buildOpenApiQueryParameters';
import { buildOpenApiSecurity } from './buildOpenApiSecurity';

// `get_v1_widgets_id` style: stable across deploys and unique per method+path,
// which is all client generators need from it.
const toOperationId = (method: string, path: string): string =>
  [method.toLowerCase(), ...path.replace(/[{}]/g, '').split('/').filter(Boolean)].join('_');

const buildResponses = (options: RouteOptions): Record<string, OpenApiResponse> => {
  const { schema, routeAuthSettings } = options;

  const responses: Record<string, OpenApiResponse> = {
    '200': schema?.responseJsonSchema
      ? { description: 'Success', content: { 'application/json': { schema: schema.responseJsonSchema } } }
      : { description: 'Success' },
  };

  if (routeAuthSettings?.userDirectoryName || routeAuthSettings?.apiKeys?.length) {
    responses['401'] = { description: 'Missing or invalid credentials' };
  }

  // Only routes that validate input can reject it; a plain route has no 422 path
  if (schema?.bodyJsonSchema || schema?.queryJsonSchema) {
    responses['422'] = { description: 'Request failed validation' };
  }

  return responses;
};

// One route becomes one operation. `options` is the route's options after the
// service defaults have been merged in, so auth requirements are the real ones.
export const buildOpenApiOperation = (route: RouteQPQWebServerConfigSetting, options: RouteOptions): OpenApiOperation => {
  const { schema } = options;
  const parameters = [...buildOpenApiPathParameters(route.path), ...buildOpenApiQueryParameters(schema?.queryJsonSchema)];
  const security = buildOpenApiSecurity(options.routeAuthSettings);

  return {
    operationId: toOperationId(route.method, route.path),
    summary: schema?.summary,
    description: schema?.description,
    tags: schema?.tags,
    parameters: parameters.length ? parameters : undefined,
    requestBody: schema?.bodyJsonSchema ? { required: true, content: { 'application/json': { schema: schema.bodyJsonSchema } } } : undefined,
    responses: buildResponses(options),
    security: security.length ? security : undefined,
  };
};
