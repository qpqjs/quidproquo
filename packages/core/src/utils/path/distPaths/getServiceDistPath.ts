import path from 'path';

import { getAppDistPath } from './getAppDistPath';

/** `dist/apps/<app>/services/<service>`: the root of one service's build outputs. */
export const getServiceDistPath = (root: string, appName: string, serviceName: string): string =>
  path.join(getAppDistPath(root, appName), 'services', serviceName);
