import path from 'path';

import { getServicesPath } from './getServicesPath';

export const getServicePath = (root: string, appName: string, serviceName: string): string => path.join(getServicesPath(root, appName), serviceName);
