import { ConfigActionType, CryptoActionType, FileActionType, SecureTokenActionType } from 'quidproquo-core';

/**
 * Action types whose successful result is a secret: the value is redacted and swept from the whole
 * log. A config secret read, a decrypt, a freshly generated secure token, and a presigned file url
 * (a bearer capability on the object until it expires).
 */
export const REDACTION_SECRET_RESULT_ACTION_TYPES: readonly string[] = [
  ConfigActionType.GetSecret,
  CryptoActionType.Decrypt,
  SecureTokenActionType.Generate,
  FileActionType.GenerateTemporarySecureUrl,
  FileActionType.GenerateTemporaryUploadSecureUrl,
];
