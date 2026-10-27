import fs from 'fs';
import path from 'path';

import { parseServiceDir } from './parseServiceDir';
import { readViewsInfo } from './readViewsInfo';
import { ViewsContext } from './ViewsContext';
import { ViewsInfo } from './ViewsInfo';

/** Resolves the views context (self + siblings) from a views directory (apps/<app>/services/<svc>/views). */
export const getViewsContext = (viewsDir: string): ViewsContext => {
  const { root, appName, serviceName: service } = parseServiceDir(path.resolve(viewsDir), 'views');

  const self = readViewsInfo(root, appName, service);
  if (!self) throw new Error(`No package.json for views project at ${viewsDir}`);

  const servicesDir = path.join(root, 'apps', appName, 'services');
  const siblings = fs
    .readdirSync(servicesDir)
    .filter((s) => s !== service)
    .map((s) => readViewsInfo(root, appName, s))
    .filter((v): v is ViewsInfo => v !== null);

  return { root, appName, self, siblings };
};
