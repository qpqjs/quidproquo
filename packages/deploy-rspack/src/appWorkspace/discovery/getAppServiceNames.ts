import fs from 'fs';
import path from 'path';

import { getServiceDirectoryNames } from './getServiceDirectoryNames';
import { getServicePath } from './getServicePath';

/** The services with an infrastructure entry (service/src/infrastructure.ts or .js): the ones a build or deploy can act on. */
export const getAppServiceNames = (root: string, appName: string): string[] =>
  getServiceDirectoryNames(root, appName).filter((serviceName) =>
    ['infrastructure.ts', 'infrastructure.js'].some((infra) =>
      fs.existsSync(path.join(getServicePath(root, appName, serviceName), 'service', 'src', infra)),
    ),
  );
