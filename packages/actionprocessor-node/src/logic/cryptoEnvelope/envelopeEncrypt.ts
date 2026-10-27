import { CryptoContext } from 'quidproquo-core';

import { createCipheriv, randomBytes } from 'crypto';

import { canonicalizeCryptoContext } from './canonicalizeCryptoContext';
import { cryptoContextHash } from './cryptoContextHash';
import { DataKeyProvider } from './DataKeyProvider';
import { encodeCryptoBlob } from './encodeCryptoBlob';

// Envelope encryption: a fresh data key from the provider, AES-256-GCM locally
// with the canonical context as AAD, wrapped key stored inside the blob.
export const envelopeEncrypt = async (plaintext: string, context: CryptoContext | undefined, dataKeyProvider: DataKeyProvider): Promise<string> => {
  const canonicalContext = canonicalizeCryptoContext(context);

  const { plaintextKey, wrappedKey } = await dataKeyProvider.generateDataKey(context || {});

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', plaintextKey, iv);
  cipher.setAAD(Buffer.from(canonicalContext, 'utf8'));

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

  return encodeCryptoBlob({
    wrappedKey,
    iv,
    authTag: cipher.getAuthTag(),
    ciphertext,
    contextHash: cryptoContextHash(canonicalContext),
  });
};
