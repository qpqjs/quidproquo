import { awsNamingUtils } from '@qpqjs/config-aws';
import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

export const resolveSecretResourceName = (secretName: string, qpqConfig: QPQConfig) => {
  const secretConfig = qpqCoreUtils.resolveSecretOrThrow(secretName, qpqConfig);

  return awsNamingUtils.resolveOwnedResourceName(secretName, qpqConfig, secretConfig.owner);
};
