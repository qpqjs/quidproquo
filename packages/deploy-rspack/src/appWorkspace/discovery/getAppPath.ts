import path from 'path';

import { getAppsPath } from './getAppsPath';

export const getAppPath = (root: string, appName: string): string => path.join(getAppsPath(root), appName);
