import { WebAddressingMode } from 'quidproquo-webserver';

import { formatOrigin } from './formatOrigin';
import { getPageRootIndex } from './getPageRootIndex';
import { getWebAddressing } from './getWebAddressing';
import { WebLocation } from './WebLocation';

/** Base url of a service's api: its resolved host plus `/<service>` on subdomains, `<host>:<apiPort>/<apiSubdomain>/<service>` on ports. */
export const getApiUrl = (service: string, apiSubdomain = 'api', location: WebLocation = window.location): string => {
  const addressing = getWebAddressing();

  if (addressing.mode === WebAddressingMode.port) {
    return `${formatOrigin(location.protocol, location.hostname, addressing.apiPort)}/${apiSubdomain}/${service}`;
  }

  const api = addressing.apis.find((candidate) => candidate.service === service && candidate.apiSubdomain === apiSubdomain);
  if (!api) {
    throw new Error(`No api '${apiSubdomain}' on service '${service}' is known to this bundle`);
  }

  return `${location.protocol}//${api.hosts[getPageRootIndex(addressing, location.hostname)]}/${service}`;
};
