import { getServiceDirectoryNames } from './discovery/getServiceDirectoryNames';
import { readViewsInfo } from './readViewsInfo';
import { ViewsInfo } from './ViewsInfo';

/** All views projects for an app (used by prep + the dev orchestrator). */
export const getAllViews = (root: string, appName: string): ViewsInfo[] =>
  getServiceDirectoryNames(root, appName)
    .map((serviceName) => readViewsInfo(root, appName, serviceName))
    .filter((views): views is ViewsInfo => views !== null);
