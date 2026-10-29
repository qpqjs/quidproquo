import path from 'path';

import { getAppPath } from './getAppPath';

/** `apps/<app>/services/`, one folder per service. */
export const getServicesPath = (root: string, appName: string): string => path.join(getAppPath(root, appName), 'services');
