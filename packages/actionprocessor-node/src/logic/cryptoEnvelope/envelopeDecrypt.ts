import { CryptoContext } from 'quidproquo-core';

import { createDecipheriv } from 'crypto';

import { canonicalizeCryptoContext } from './canonicalizeCryptoContext';
import { cryptoContextHash } from './cryptoContextHash';
import { CryptoContextMismatchError } from './CryptoContextMismatchError';
import { CryptoMalformedCiphertextError } from './CryptoMalformedCiphertextError';
import { DataKeyProvider } from './DataKeyProvider';
import { decodeCryptoBlob } from './decodeCryptoBlob';

export const envelopeDecrypt = async (ciphertext: string, context: CryptoContext | undefined, dataKeyProvider: DataKeyProvider): Promise<string> => {
  const blob = decodeCryptoBlob(ciphertext);

  // Context is checked against the stored hash BEFORE any key unwrap or GCM
  // work: a mismatch fails as ContextMismatch (probable scoping bug) rather
  // than a bare tag failure that reads as corruption.
  const canonicalContext = canonicalizeCryptoContext(context);
  if (blob.contextHash !== cryptoContextHash(canonicalContext)) {
    throw new CryptoContextMismatchError('Supplied crypto context does not match the context this value was encrypted under');
  }

  const plaintextKey = await dataKeyProvider.unwrapDataKey(blob.wrappedKey, context || {});

  const decipher = createDecipheriv('aes-256-gcm', plaintextKey, blob.iv);
  decipher.setAAD(Buffer.from(canonicalContext, 'utf8'));
  decipher.setAuthTag(blob.authTag);

  // Context hash already matched, so a GCM auth failure here means the
  // ciphertext bytes themselves are corrupt or truncated.
  try {
    return Buffer.concat([decipher.update(blob.ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new CryptoMalformedCiphertextError('Ciphertext failed authenticated decryption; the stored value is corrupt or truncated');
  }
};
