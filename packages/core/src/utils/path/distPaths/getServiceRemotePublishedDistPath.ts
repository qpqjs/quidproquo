import path from 'path';

import { getServiceDistPath } from './getServiceDistPath';

/** The remote build as published to the federated code store. */
export const getServiceRemotePublishedDistPath = (root: string, appName: string, serviceName: string): string =>
  path.join(getServiceDistPath(root, appName, serviceName), 'service-remote-published');
