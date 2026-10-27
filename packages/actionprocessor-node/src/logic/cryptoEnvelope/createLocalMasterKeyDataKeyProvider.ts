import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

import { canonicalizeCryptoContext } from './canonicalizeCryptoContext';
import { CryptoMalformedCiphertextError } from './CryptoMalformedCiphertextError';
import { DataKeyProvider } from './DataKeyProvider';

// A DataKeyProvider that wraps data keys with AES-256-GCM under a local
// 32-byte master key, with the canonical context as AAD (mirroring KMS
// EncryptionContext binding). Used by the dev server so envelope encryption
// runs the identical code path offline. Wrapped key layout: iv(12) tag(16) key.
export const createLocalMasterKeyDataKeyProvider = (masterKey: Buffer): DataKeyProvider => ({
  generateDataKey: async (context) => {
    const plaintextKey = randomBytes(32);

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', masterKey, iv);
    cipher.setAAD(Buffer.from(canonicalizeCryptoContext(context), 'utf8'));

    const wrappedKeyBytes = Buffer.concat([cipher.update(plaintextKey), cipher.final()]);

    return {
      plaintextKey,
      wrappedKey: Buffer.concat([iv, cipher.getAuthTag(), wrappedKeyBytes]),
    };
  },

  unwrapDataKey: async (wrappedKey, context) => {
    if (wrappedKey.length < 28) {
      throw new CryptoMalformedCiphertextError('Wrapped data key is truncated');
    }

    const decipher = createDecipheriv('aes-256-gcm', masterKey, wrappedKey.subarray(0, 12));
    decipher.setAAD(Buffer.from(canonicalizeCryptoContext(context), 'utf8'));
    decipher.setAuthTag(wrappedKey.subarray(12, 28));

    try {
      return Buffer.concat([decipher.update(wrappedKey.subarray(28)), decipher.final()]);
    } catch {
      throw new CryptoMalformedCiphertextError('Wrapped data key failed authenticated decryption');
    }
  },
});
