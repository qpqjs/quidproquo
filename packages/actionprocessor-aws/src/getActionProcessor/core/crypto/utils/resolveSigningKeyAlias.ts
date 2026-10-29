import { Nullable, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { resolveOwnedResourceName } from '../../../../awsNamingUtils';

// The signing-key twin of resolveCryptoKeyAlias: the deterministic KMS alias the
// CDK construct derives for a defineSigningKey, or null when none matches so
// processors can fail with KeyNotConfigured instead of a generic error.
export const resolveSigningKeyAlias = (signingKeyName: string, qpqConfig: QPQConfig): Nullable<string> => {
  const signingKeyConfig = qpqCoreUtils.getAllSigningKeyConfigs(qpqConfig).find((k) => k.keyName === signingKeyName);

  if (!signingKeyConfig) {
    return null;
  }

  const resolvedName = resolveOwnedResourceName(signingKeyName, qpqConfig, signingKeyConfig.owner);

  return `alias/${resolvedName}`;
};
