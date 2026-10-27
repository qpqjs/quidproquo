import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { getConfigRuntimeResourceNameFromConfigWithServiceOverride } from '../../../../awsNamingUtils';

export const resolveSecretResourceName = (secretName: string, qpqConfig: QPQConfig) => {
  const secretConfig = qpqCoreUtils.getSecretByName(secretName, qpqConfig);

  return getConfigRuntimeResourceNameFromConfigWithServiceOverride(
    secretConfig.owner?.resourceNameOverride || secretName,
    qpqConfig,
    secretConfig.owner?.module,
  );
};
