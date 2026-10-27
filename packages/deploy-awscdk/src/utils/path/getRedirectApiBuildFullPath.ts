import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { SubdomainRedirectQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { join } from 'upath';

export const getRedirectApiBuildFullPath = (qpqConfig: QPQConfig, redirectConfig: SubdomainRedirectQPQWebServerConfigSetting): string => {
  const apiEntry = redirectConfig.apiBuildPath;

  return join(qpqCoreUtils.getConfigRoot(qpqConfig), apiEntry);
};
