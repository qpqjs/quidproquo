import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { getDevServerOptions } from '../settings/defineDevServerOptions';
import { WebEntryHost } from './WebEntryHost';

/**
 * Every web entry given a port in `defineDevServerOptions({ webEntries })`, across all services.
 * Throws when a listed name has no matching `defineWebEntry`, when two entries share a port, or
 * when an entry takes one of `reservedPorts` (the server's own listeners).
 */
export const getWebEntryHosts = (qpqConfigs: QPQConfig[], reservedPorts: number[] = []): WebEntryHost[] => {
  const hosts: WebEntryHost[] = [];

  for (const qpqConfig of qpqConfigs) {
    const service = qpqCoreUtils.getApplicationModuleName(qpqConfig);
    const webEntries = qpqWebServerUtils.getWebEntryConfigs(qpqConfig);
    const configRoot = qpqCoreUtils.getConfigRoot(qpqConfig);

    for (const [entryName, options] of Object.entries(getDevServerOptions(qpqConfig).webEntries ?? {})) {
      const webEntry = webEntries.find((entry) => entry.name === entryName);
      if (!webEntry) {
        throw new Error(`[${service}] defineDevServerOptions lists webEntries.${entryName}, but the service has no defineWebEntry('${entryName}')`);
      }

      hosts.push({ service, entryName, port: options.port, webEntry, configRoot });
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

  return hosts;
};
