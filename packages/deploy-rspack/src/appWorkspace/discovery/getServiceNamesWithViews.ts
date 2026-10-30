import path from 'path';

import { getBackendServiceNames } from './getBackendServiceNames';
import { getServicePath } from './getServicePath';
import { isDirectory } from './isDirectory';

/** The backend services that also ship a frontend (a views/ folder). */
export const getServiceNamesWithViews = (root: string, appName: string): string[] =>
  getBackendServiceNames(root, appName).filter((serviceName) => isDirectory(path.join(getServicePath(root, appName, serviceName), 'views')));
