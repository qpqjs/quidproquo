import { Nullable, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { resolveOwnedResourceName } from '../../../../awsNamingUtils';

// Returns the deterministic KMS alias for a configured crypto key (the same
// name the CDK construct derives), or null when no defineCryptoKey matches so
// processors can fail with KeyNotConfigured instead of a generic error.
export const resolveCryptoKeyAlias = (cryptoKeyName: string, qpqConfig: QPQConfig): Nullable<string> => {
  const cryptoKeyConfig = qpqCoreUtils.getAllCryptoKeyConfigs(qpqConfig).find((k) => k.keyName === cryptoKeyName);

  if (!cryptoKeyConfig) {
    return null;
  }

  const resolvedName = resolveOwnedResourceName(cryptoKeyName, qpqConfig, cryptoKeyConfig.owner);

  return `alias/${resolvedName}`;
};
