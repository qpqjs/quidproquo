import path from 'path';

import { getServiceDistPath } from './getServiceDistPath';

/** The service's module-federation remote build, a sibling of the static bundle so the two never clobber each other. */
export const getServiceRemoteDistPath = (root: string, appName: string, serviceName: string): string =>
  path.join(getServiceDistPath(root, appName, serviceName), 'service-remote');
