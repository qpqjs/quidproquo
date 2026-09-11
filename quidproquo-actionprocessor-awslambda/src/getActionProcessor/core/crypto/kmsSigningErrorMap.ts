import { actionResultError } from 'quidproquo-core';

type SigningErrorTypes = {
  KeyUnavailable: string;
  Throttling: string;
};

// The KMS exceptions every signing-key processor maps the same way, keyed by
// error.name as actionResultErrorFromCaughtError expects.
export const kmsSigningErrorMap = (errorType: SigningErrorTypes, keyName: string) => ({
  NotFoundException: () => actionResultError(errorType.KeyUnavailable, `Signing key not found: [${keyName}]`),
  DisabledException: () => actionResultError(errorType.KeyUnavailable, `Signing key is disabled: [${keyName}]`),
  KMSInvalidStateException: () => actionResultError(errorType.KeyUnavailable, `Signing key is in an unusable state: [${keyName}]`),
  AccessDeniedException: () => actionResultError(errorType.KeyUnavailable, `Access denied to signing key: [${keyName}]`),
  ThrottlingException: () => actionResultError(errorType.Throttling, 'Throttling: Rate exceeded'),
});

export const signingKeyNotConfiguredMessage = (keyName: string) => `Signing key not configured: [${keyName}] - declare it with defineSigningKey`;
