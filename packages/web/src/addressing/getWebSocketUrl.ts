import { WebAddressingMode } from 'quidproquo-webserver';

import { formatOrigin } from './formatOrigin';
import { getPageRootIndex } from './getPageRootIndex';
import { getWebAddressing } from './getWebAddressing';
import { WebLocation } from './WebLocation';

const toWebSocketProtocol = (protocol: string): string => (protocol === 'https:' ? 'wss:' : 'ws:');

/** Url of a service's websocket api: its resolved host on subdomains, `<host>:<webSocketPort>/<service>/<apiSubdomain>` on ports. */
export const getWebSocketUrl = (service: string, apiSubdomain: string, location: WebLocation = window.location): string => {
  const addressing = getWebAddressing();
  const protocol = toWebSocketProtocol(location.protocol);

  if (addressing.mode === WebAddressingMode.port) {
    return `${formatOrigin(protocol, location.hostname, addressing.webSocketPort)}/${service}/${apiSubdomain}`;
  }

  const webSocket = addressing.webSockets.find((candidate) => candidate.service === service && candidate.apiSubdomain === apiSubdomain);
  if (!webSocket) {
    throw new Error(`No websocket '${apiSubdomain}' on service '${service}' is known to this bundle`);
  }

  return `${protocol}//${webSocket.hosts[getPageRootIndex(addressing, location.hostname)]}`;
};
