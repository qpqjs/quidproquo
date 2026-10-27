import { QPQConfig } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { DevServerConfig } from './types';

/**
 * The service configs as the dev server runs them: every root becomes the local origin
 * (`localhost:<port>`, so the localhost resolver serves everything from one host and the
 * app's resolver pointer is dropped) and local plus wildcard origins join CORS. Works on a
 * clone; the caller's configs are untouched.
 */
export function getAllServiceConfigs(devServerConfig: DevServerConfig): QPQConfig[] {
  const allServices: QPQConfig[] = JSON.parse(JSON.stringify(devServerConfig.qpqConfigs));

  const rootDomain = `${devServerConfig.serverDomain}:${devServerConfig.serverPort}`;
  const localOrigin = `http://${rootDomain}`;

  for (const qpqConfig of allServices) {
    const dnsConfig = qpqWebServerUtils.getDnsConfig(qpqConfig);
    if (dnsConfig) {
      dnsConfig.rootDomains = [rootDomain];
      delete dnsConfig.resolver;
    }

    for (const defaultRouteSetting of qpqWebServerUtils.getDefaultRouteSettings(qpqConfig)) {
      defaultRouteSetting.routeOptions.allowedOrigins = [...(defaultRouteSetting.routeOptions.allowedOrigins || []), localOrigin, '*'];
    }

    for (const route of qpqWebServerUtils.getAllRoutes(qpqConfig)) {
      route.options.allowedOrigins = [...(route.options.allowedOrigins || []), localOrigin, '*'];
    }
  }

  return allServices;
}
