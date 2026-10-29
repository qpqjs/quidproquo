import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { resolveOwnedResourceName } from '../awsNamingUtils';

/**
 * Resolves a parameter name to its deployed SSM parameter key, honouring
 * cross-module ownership (owner module / resource name override) so a service
 * can read a parameter another module owns.
 */
export const resolveParameterKey = (parameterName: string, qpqConfig: QPQConfig) => {
  const parameterConfig = qpqCoreUtils.resolveParameterOrThrow(parameterName, qpqConfig);

  return resolveOwnedResourceName(parameterName, qpqConfig, parameterConfig.owner);
};
