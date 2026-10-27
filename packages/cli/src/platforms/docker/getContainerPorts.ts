import { WebEntryHost } from 'quidproquo-dev-server';

import { ResolvedDevServerPorts } from '../../lib/devServerPorts';

/** Every port the image listens on: the app's dev-server ports plus one per hosted web entry. */
export const getContainerPorts = (devServerPorts: ResolvedDevServerPorts, hosts: WebEntryHost[]): number[] => [
  devServerPorts.api,
  devServerPorts.webSocket,
  devServerPorts.fileStorage,
  ...hosts.map((host) => host.port),
];
