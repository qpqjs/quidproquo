import path from 'path';

import { getServiceDistPath } from './getServiceDistPath';

/** The service's built views (its web entries). */
export const getViewsDistPath = (root: string, appName: string, serviceName: string): string =>
  path.join(getServiceDistPath(root, appName, serviceName), 'views');
