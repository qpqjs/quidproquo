import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { getConfigRuntimeResourceNameFromConfigWithServiceOverride } from '../awsNamingUtils';

/**
 * Resolves a parameter name to its deployed SSM parameter key, honouring
 * cross-module ownership (owner module / resource name override) so a service
 * can read a parameter another module owns.
 */
export const resolveParameterKey = (parameterName: string, qpqConfig: QPQConfig) => {
  const parameterConfig = qpqCoreUtils.getParameterConfig(parameterName, qpqConfig);

  return getConfigRuntimeResourceNameFromConfigWithServiceOverride(
    parameterConfig.owner?.resourceNameOverride || parameterName,
    qpqConfig,
    parameterConfig.owner?.module,
  );
};
