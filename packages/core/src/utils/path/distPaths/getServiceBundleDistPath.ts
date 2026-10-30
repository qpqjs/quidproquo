import path from 'path';

import { getServiceDistPath } from './getServiceDistPath';

/** The service's static backend bundle. */
export const getServiceBundleDistPath = (root: string, appName: string, serviceName: string): string =>
  path.join(getServiceDistPath(root, appName, serviceName), 'service');
