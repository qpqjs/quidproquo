// Views build — programmatic (getViewsRspackConfig), platform-neutral. Where
// the built views get hosted is a platform driver concern (see
// platforms/<platform>/viewsSync).
import { getViewsRspackConfig, runRspack } from '@qpqjs/deploy-rspack';

import path from 'path';

import { getRoot, getServiceDirectory } from './discovery';

export const bundleViews = async (appName: string, serviceName: string): Promise<void> => {
  const viewsDir = path.join(getServiceDirectory(appName, serviceName), 'views');

  process.env.NODE_ENV = 'production';
  delete process.env.LOCAL_DEV_SERVER;

  await runRspack(getViewsRspackConfig(viewsDir));
};

export const getViewsDistDir = (appName: string, serviceName: string): string =>
  path.join(getRoot(), 'dist', 'apps', appName, 'services', serviceName, 'views');
