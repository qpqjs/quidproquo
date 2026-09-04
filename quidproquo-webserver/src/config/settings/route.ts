import { getUniqueKeyFromQpqFunctionRuntime, HTTPMethod, QPQConfigSetting, QpqFunctionRuntime } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../QPQConfig';
import { RouteSchema } from '../types/RouteSchema';
import { ApiKeyReference } from './apiKey';

interface GenericRouteAuthSettings<T> {
  userDirectoryName?: string;

  scopes?: string[];

  apiKeys?: T[];
}

export interface ServiceAllowedOrigin {
  /**
   * The name of the api subdomain name for the given service
   */
  api: string;
  /**
   * The domain name the service is hosted on, if left undefined, the domain name of this service will be used
   */
  domain?: string;
  /**
   * The service name, as seen in the subdomain
   */
  service?: string;

  /**
   * The protocol to use, defaults to https
   */
  protocol?: 'http' | 'https';
}

export interface GenericRouteOptions<T> {
  allowedOrigins?: (string | ServiceAllowedOrigin)[];

  routeAuthSettings?: GenericRouteAuthSettings<T>;

  // Request and response shapes for validation and the generated OpenAPI document
  schema?: RouteSchema;
}

// TODO: Probably clean up the types here
// The idea is just so we can let the user define apiKeys as strings not objects
// But let the internal logic always use objects
export type RouteAuthSettings = GenericRouteAuthSettings<ApiKeyReference>;
export type RouteOptions = GenericRouteOptions<ApiKeyReference>;

export interface RouteQPQWebServerConfigSetting extends QPQConfigSetting {
  method: HTTPMethod;
  path: string;
  runtime: QpqFunctionRuntime;
  options: RouteOptions;
}

export const defineRoute = (
  method: HTTPMethod,
  path: string,
  runtime: QpqFunctionRuntime,
  options: GenericRouteOptions<ApiKeyReference | string> = {},
): RouteQPQWebServerConfigSetting => {
  const routeAuthSettings = options.routeAuthSettings || {};
  const apiKeys = routeAuthSettings.apiKeys || [];
  const newOptions = {
    ...options,
    routeAuthSettings: {
      ...routeAuthSettings,
      apiKeys: apiKeys.map((apiKey) => (typeof apiKey === 'string' ? { name: apiKey } : apiKey)),
    },
  };

  return {
    configSettingType: QPQWebServerConfigSettingType.Route,
    uniqueKey: getUniqueKeyFromQpqFunctionRuntime(runtime),

    method,
    path,
    runtime,
    options: newOptions,
  };
};
