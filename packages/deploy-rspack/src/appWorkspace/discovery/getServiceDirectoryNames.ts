import fs from 'fs';

import { getServicePath } from './getServicePath';
import { getServicesPath } from './getServicesPath';
import { isDirectory } from './isDirectory';

/** Every service folder of an app, whatever it contains. */
export const getServiceDirectoryNames = (root: string, appName: string): string[] => {
  const servicesPath = getServicesPath(root, appName);

  if (!isDirectory(servicesPath)) {
    return [];
  }

  return fs.readdirSync(servicesPath).filter((name) => isDirectory(getServicePath(root, appName, name)));
};
