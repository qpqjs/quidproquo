import { Nullable } from 'quidproquo-core';
import { getDevServerOptions } from 'quidproquo-dev-server';

import fs from 'fs';
import path from 'path';

import { requireQpqConfig } from './requireQpqConfig';
import { sanitizeMfName } from './sanitizeMfName';
import { ViewsInfo } from './ViewsInfo';

// Local dev-server port: the service's `defineDevServerOptions({ views: { port } })`,
// falling back to a legacy `"port"` in the views package.json, then 4200.
// Requiring the TS infrastructure module relies on the caller running with TS
// require hooks (rspack.config.ts evaluation / ts-node), as the views build
// already does.
const resolveViewsPort = (viewsDir: string, pkg: { port?: number | string }): number => {
  try {
    const port = getDevServerOptions(requireQpqConfig(path.join(viewsDir, '..', 'service', 'src', 'infrastructure'))).views?.port;
    if (port) {
      return port;
    }
  } catch {
    // fall through to the package.json port
  }

  return Number(pkg.port) || 4200;
};

/** ViewsInfo for one service's views project, or null when it has no views package.json. */
export const readViewsInfo = (root: string, appName: string, service: string): Nullable<ViewsInfo> => {
  const viewsDir = path.join(root, 'apps', appName, 'services', service, 'views');
  const pkgPath = path.join(viewsDir, 'package.json');
  if (!fs.existsSync(pkgPath)) return null;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const alias = pkg.name || `@${appName}/${service}-service-views`;
  return {
    service,
    appName,
    viewsDir,
    alias,
    mfName: sanitizeMfName(alias),
    port: resolveViewsPort(viewsDir, pkg),
  };
};
