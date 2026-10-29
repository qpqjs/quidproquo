import path from 'path';

import { getServiceDirectoryNames } from './getServiceDirectoryNames';
import { getServicePath } from './getServicePath';
import { isDirectory } from './isDirectory';

/** The services whose folder holds the given child directory ('service' for a backend, 'views' for a frontend). */
export const getServiceNamesWithSubdir = (root: string, appName: string, subdir: string): string[] =>
  getServiceDirectoryNames(root, appName).filter((serviceName) => isDirectory(path.join(getServicePath(root, appName, serviceName), subdir)));
