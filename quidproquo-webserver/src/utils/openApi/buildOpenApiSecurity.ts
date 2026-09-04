import { RouteAuthSettings } from '../../config/settings/route';
import { OpenApiSecurityRequirement, OpenApiSecurityScheme } from '../../types/OpenApiDocument';
import { OPEN_API_API_KEY_AUTH, OPEN_API_BEARER_AUTH } from './openApiSecuritySchemeNames';

// Mirrors what askValidateRouteAuth actually checks: a user directory means a JWT in
// the Authorization header, api keys mean the x-api-key header. Either satisfies the
// route, so they are listed as alternatives rather than both required.
export const buildOpenApiSecurity = (routeAuthSettings?: RouteAuthSettings): OpenApiSecurityRequirement[] => {
  const requirements: OpenApiSecurityRequirement[] = [];

  if (routeAuthSettings?.userDirectoryName) {
    requirements.push({ [OPEN_API_BEARER_AUTH]: routeAuthSettings.scopes ?? [] });
  }

  if (routeAuthSettings?.apiKeys?.length) {
    requirements.push({ [OPEN_API_API_KEY_AUTH]: [] });
  }

  return requirements;
};

export const openApiSecuritySchemes: Record<string, OpenApiSecurityScheme> = {
  [OPEN_API_BEARER_AUTH]: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
  [OPEN_API_API_KEY_AUTH]: { type: 'apiKey', in: 'header', name: 'x-api-key' },
};
