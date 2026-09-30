import { ConfigActionType, CryptoActionType, SecureTokenActionType } from 'quidproquo-core';

/**
 * Action types whose successful result is a secret: the value is redacted and swept from the whole
 * log. A config secret read, a decrypt, and a freshly generated secure token.
 */
export const REDACTION_SECRET_RESULT_ACTION_TYPES: readonly string[] = [
  ConfigActionType.GetSecret,
  CryptoActionType.Decrypt,
  SecureTokenActionType.Generate,
];
