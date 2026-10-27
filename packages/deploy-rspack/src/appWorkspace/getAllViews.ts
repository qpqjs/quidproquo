import fs from 'fs';
import path from 'path';

import { readViewsInfo } from './readViewsInfo';
import { ViewsInfo } from './ViewsInfo';

/** All views projects for an app (used by prep + the dev orchestrator). */
export const getAllViews = (root: string, appName: string): ViewsInfo[] => {
  const servicesDir = path.join(root, 'apps', appName, 'services');
  if (!fs.existsSync(servicesDir)) return [];
  return fs
    .readdirSync(servicesDir)
    .map((s) => readViewsInfo(root, appName, s))
    .filter((v): v is ViewsInfo => v !== null);
};
