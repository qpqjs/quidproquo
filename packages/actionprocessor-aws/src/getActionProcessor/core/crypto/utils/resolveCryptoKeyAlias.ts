import { Nullable, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { getConfigRuntimeResourceNameFromConfigWithServiceOverride } from '../../../../awsNamingUtils';

// Returns the deterministic KMS alias for a configured crypto key (the same
// name the CDK construct derives), or null when no defineCryptoKey matches so
// processors can fail with KeyNotConfigured instead of a generic error.
export const resolveCryptoKeyAlias = (cryptoKeyName: string, qpqConfig: QPQConfig): Nullable<string> => {
  const cryptoKeyConfig = qpqCoreUtils.getAllCryptoKeyConfigs(qpqConfig).find((k) => k.keyName === cryptoKeyName);

  if (!cryptoKeyConfig) {
    return null;
  }

  const resolvedName = getConfigRuntimeResourceNameFromConfigWithServiceOverride(
    cryptoKeyConfig.owner?.resourceNameOverride || cryptoKeyName,
    qpqConfig,
    cryptoKeyConfig.owner?.module,
  );

  return `alias/${resolvedName}`;
};
