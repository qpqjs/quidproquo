import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { join } from 'upath';

export const getApiBuildPathFullPath = (qpqConfig: QPQConfig): string => {
  const configRoot = qpqCoreUtils.getConfigRoot(qpqConfig);
  const apiBuildPath = qpqCoreUtils.getApiBuildPath(qpqConfig);

  return join(configRoot, apiBuildPath);
};
