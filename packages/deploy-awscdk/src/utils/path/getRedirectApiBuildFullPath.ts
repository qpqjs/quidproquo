import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';
import { SubdomainRedirectQPQWebServerConfigSetting } from '@qpqjs/webserver';

import { join } from 'upath';

export const getRedirectApiBuildFullPath = (qpqConfig: QPQConfig, redirectConfig: SubdomainRedirectQPQWebServerConfigSetting): string => {
  const apiEntry = redirectConfig.apiBuildPath;

  return join(qpqCoreUtils.getConfigRoot(qpqConfig), apiEntry);
};
