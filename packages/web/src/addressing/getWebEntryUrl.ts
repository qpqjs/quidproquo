import { WebAddressingMode } from 'quidproquo-webserver';

import { formatOrigin } from './formatOrigin';
import { getPageRootIndex } from './getPageRootIndex';
import { getWebAddressing } from './getWebAddressing';
import { WebLocation } from './WebLocation';

/**
 * The origin (plus path, in port mode) of a web entry, by its `defineWebEntry` name. Pass the
 * service when two services define an entry of that name. Throws for an unknown entry.
 */
export const getWebEntryUrl = (entryName: string, service?: string, location: WebLocation = window.location): string => {
  const addressing = getWebAddressing();
  const entry = addressing.entries.find((candidate) => candidate.name === entryName && (service === undefined || candidate.service === service));
  if (!entry) {
    throw new Error(`No web entry named '${entryName}'${service ? ` in service '${service}'` : ''} is known to this bundle`);
  }

  if (addressing.mode === WebAddressingMode.subdomain) {
    return `${location.protocol}//${entry.hosts[getPageRootIndex(addressing, location.hostname)]}`;
  }

  if (entry.port !== null) {
    return formatOrigin(location.protocol, location.hostname, entry.port);
  }

  return `${formatOrigin(location.protocol, location.hostname, addressing.apiPort)}${entry.path === '/' ? '' : entry.path}`;
};
