import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { resolveOwnedResourceName } from '../../../../awsNamingUtils';

export const resolveSecretResourceName = (secretName: string, qpqConfig: QPQConfig) => {
  const secretConfig = qpqCoreUtils.getSecretByName(secretName, qpqConfig);

  return resolveOwnedResourceName(secretName, qpqConfig, secretConfig.owner);
};
