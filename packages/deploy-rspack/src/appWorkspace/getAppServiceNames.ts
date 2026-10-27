import fs from 'fs';
import path from 'path';

/**
 * Names of every service under apps/<app>/services that has an
 * infrastructure entry (service/src/infrastructure.ts or .js).
 */
export const getAppServiceNames = (root: string, appName: string): string[] => {
  const dir = path.join(root, 'apps', appName, 'services');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((s) => ['infrastructure.ts', 'infrastructure.js'].some((infra) => fs.existsSync(path.join(dir, s, 'service', 'src', infra))));
};
