import { WebEntryHost } from 'quidproquo-dev-server';

import { DEV_SERVER_PORTS } from '../../lib/devServerPorts';

/** The ports the image listens on regardless of the app. */
export const BASE_CONTAINER_PORTS: number[] = [DEV_SERVER_PORTS.api, DEV_SERVER_PORTS.webSocket, DEV_SERVER_PORTS.fileStorage];

/** Every port the image listens on: the fixed dev-server ports plus one per hosted web entry. */
export const getContainerPorts = (hosts: WebEntryHost[]): number[] => [...BASE_CONTAINER_PORTS, ...hosts.map((host) => host.port)];
