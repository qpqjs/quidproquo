import { QPQConfig } from 'quidproquo-core';

import { RouteAuthSettings, RouteQPQWebServerConfigSetting } from '../config/settings/route';
import { RouteOptions } from '../config/settings/route';
import { getDefaultRouteSettings } from './qpqConfigAccessorsUtils';

export const mergeRouteAuthSettings = (routeAuthSettingsA?: RouteAuthSettings, routeAuthSettingsB?: RouteAuthSettings): RouteAuthSettings => {
  return {
    userDirectoryName: routeAuthSettingsB?.userDirectoryName || routeAuthSettingsA?.userDirectoryName,
    scopes: [...new Set([...(routeAuthSettingsB?.scopes || []), ...(routeAuthSettingsA?.scopes || [])])],

    apiKeys: [...(routeAuthSettingsB?.apiKeys || []), ...(routeAuthSettingsA?.apiKeys || [])].filter(
      (apiKeyRef, index, arr) =>
        arr.findIndex(
          (item) => item.name === apiKeyRef.name && item.applicationName === apiKeyRef.applicationName && item.serviceName === apiKeyRef.serviceName,
        ) === index,
    ),
  };
};

export const mergeRouteOptions = (routeOptionsA: RouteOptions, routeOptionsB: RouteOptions): RouteOptions => {
  return {
    allowedOrigins: [...new Set([...(routeOptionsB.allowedOrigins || []), ...(routeOptionsA.allowedOrigins || [])])],
    routeAuthSettings: mergeRouteAuthSettings(routeOptionsA.routeAuthSettings, routeOptionsB.routeAuthSettings),

    // Schemas describe one route, they are never shared defaults, so the more specific side wins outright
    schema: routeOptionsB.schema ?? routeOptionsA.schema,
  };
};

export const mergeAllRouteOptions = (activeApi: string, routeConfig: RouteQPQWebServerConfigSetting, qpqConfig: QPQConfig): RouteOptions => {
  // TODO: This needs to filter active route on the current route Config
  // activeApi
  const defaultOptions = getDefaultRouteSettings(qpqConfig).map((o) => o.routeOptions);
  const routeOptions = routeConfig.options;

  return [...defaultOptions, routeOptions].reduce((acc, opt) => mergeRouteOptions(acc, opt), {} as RouteOptions);
};
