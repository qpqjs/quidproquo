import { awsNamingUtils } from '@qpqjs/config-aws';
import { Nullable, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

// The signing-key twin of resolveCryptoKeyAlias: the deterministic KMS alias the
// CDK construct derives for a defineSigningKey, or null when none matches so
// processors can fail with KeyNotConfigured instead of a generic error.
export const resolveSigningKeyAlias = (signingKeyName: string, qpqConfig: QPQConfig): Nullable<string> => {
  const signingKeyConfig = qpqCoreUtils.getSigningKeyByName(signingKeyName, qpqConfig);

  if (!signingKeyConfig) {
    return null;
  }

  const resolvedName = awsNamingUtils.resolveOwnedResourceName(signingKeyName, qpqConfig, signingKeyConfig.owner);

  return `alias/${resolvedName}`;
};
