import { Nullable, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { getConfigRuntimeResourceNameFromConfigWithServiceOverride } from '../../../../awsNamingUtils';

// The signing-key twin of resolveCryptoKeyAlias: the deterministic KMS alias the
// CDK construct derives for a defineSigningKey, or null when none matches so
// processors can fail with KeyNotConfigured instead of a generic error.
export const resolveSigningKeyAlias = (signingKeyName: string, qpqConfig: QPQConfig): Nullable<string> => {
  const signingKeyConfig = qpqCoreUtils.getAllSigningKeyConfigs(qpqConfig).find((k) => k.keyName === signingKeyName);

  if (!signingKeyConfig) {
    return null;
  }

  const resolvedName = getConfigRuntimeResourceNameFromConfigWithServiceOverride(
    signingKeyConfig.owner?.resourceNameOverride || signingKeyName,
    qpqConfig,
    signingKeyConfig.owner?.module,
  );

  return `alias/${resolvedName}`;
};
