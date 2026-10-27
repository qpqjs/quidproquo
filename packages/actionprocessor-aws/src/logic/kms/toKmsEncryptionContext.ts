import { CryptoContext } from 'quidproquo-core';

// KMS treats a missing EncryptionContext and an empty one as equivalent, but
// we normalise to undefined so requests are byte-identical either way.
export const toKmsEncryptionContext = (context: CryptoContext): Record<string, string> | undefined => {
  return Object.keys(context).length > 0 ? context : undefined;
};
