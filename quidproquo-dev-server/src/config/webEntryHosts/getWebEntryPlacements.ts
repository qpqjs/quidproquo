import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils, WebEntryQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { getDevServerOptions } from '../settings/defineDevServerOptions';
import { WebEntryHost } from './WebEntryHost';
import { WebEntryPlacements } from './WebEntryPlacements';
import { WebEntryRoute } from './WebEntryRoute';

const getRoutePath = (webEntry: WebEntryQPQWebServerConfigSetting, label: string): string => {
  if (webEntry.domain.subDomainName) {
    return `/${webEntry.domain.subDomainName}`;
  }
  if (webEntry.domain.onRootDomain) {
    return '/';
  }
  throw new Error(`Web entry ${label} is neither on the root domain nor on a subdomain, so it has nowhere to be served; give it a port`);
};

/**
 * Places every web entry across all services: an entry given a port in
 * `defineDevServerOptions({ webEntries })` gets its own listener, every other one is routed
 * same-origin by its domain (`/` for the root-domain entry, `/<subdomain>` otherwise). Throws
 * for a listed name with no `defineWebEntry`, two entries on one port or path, a port in
 * `reservedPorts`, or more than one root-domain entry.
 */
export const getWebEntryPlacements = (qpqConfigs: QPQConfig[], reservedPorts: number[] = []): WebEntryPlacements => {
  const hosts: WebEntryHost[] = [];
  const routes: WebEntryRoute[] = [];

  for (const qpqConfig of qpqConfigs) {
    const service = qpqCoreUtils.getApplicationModuleName(qpqConfig);
    const configRoot = qpqCoreUtils.getConfigRoot(qpqConfig);
    const webEntries = qpqWebServerUtils.getWebEntryConfigs(qpqConfig);
    const portedEntries = getDevServerOptions(qpqConfig).webEntries ?? {};

    for (const entryName of Object.keys(portedEntries)) {
      if (!webEntries.some((entry) => entry.name === entryName)) {
        throw new Error(`[${service}] defineDevServerOptions lists webEntries.${entryName}, but the service has no defineWebEntry('${entryName}')`);
      }
    }

    for (const webEntry of webEntries) {
      const entryName = webEntry.name;
      const ported = portedEntries[entryName];
      if (ported) {
        hosts.push({ service, entryName, port: ported.port, webEntry, configRoot });
      } else {
        routes.push({ service, entryName, path: getRoutePath(webEntry, `${service}/${entryName}`), webEntry, configRoot });
      }
    }
  }

  for (const host of hosts) {
    const label = `${host.service}/${host.entryName}`;

    if (reservedPorts.includes(host.port)) {
      throw new Error(`Web entry ${label} uses port ${host.port}, which the dev server already listens on`);
    }

    const clash = hosts.find((other) => other !== host && other.port === host.port);
    if (clash) {
      throw new Error(`Web entries ${label} and ${clash.service}/${clash.entryName} both use port ${host.port}`);
    }
  }

  for (const route of routes) {
    const clash = routes.find((other) => other !== route && other.path === route.path);
    if (clash) {
      const where = route.path === '/' ? 'are both on the root domain' : `are both at ${route.path}`;
      throw new Error(`Web entries ${route.service}/${route.entryName} and ${clash.service}/${clash.entryName} ${where}`);
    }
  }

  const rootLast = (a: WebEntryRoute, b: WebEntryRoute): number => Number(a.path === '/') - Number(b.path === '/');

  return { hosts, routes: [...routes].sort(rootLast) };
};
