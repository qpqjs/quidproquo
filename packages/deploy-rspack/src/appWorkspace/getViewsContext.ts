import path from 'path';

import { getServiceDirectoryNames } from './discovery/getServiceDirectoryNames';
import { parseServiceDir } from './parseServiceDir';
import { readViewsInfo } from './readViewsInfo';
import { ViewsContext } from './ViewsContext';
import { ViewsInfo } from './ViewsInfo';

/** Resolves the views context (self + siblings) from a views directory (apps/<app>/services/<svc>/views). */
export const getViewsContext = (viewsDir: string): ViewsContext => {
  const { root, appName, serviceName: service } = parseServiceDir(path.resolve(viewsDir), 'views');

  const self = readViewsInfo(root, appName, service);
  if (!self) throw new Error(`No package.json for views project at ${viewsDir}`);

  const siblings = getServiceDirectoryNames(root, appName)
    .filter((serviceName) => serviceName !== service)
    .map((serviceName) => readViewsInfo(root, appName, serviceName))
    .filter((views): views is ViewsInfo => views !== null);

  return { root, appName, self, siblings };
};
