import { CryptoBlob } from './CryptoBlob';
import { CRYPTO_BLOB_PREFIX_V1 } from './cryptoBlobPrefix';
import { CryptoMalformedCiphertextError } from './CryptoMalformedCiphertextError';

// Parsing failures all collapse to CryptoMalformedCiphertextError: anything
// that is not a well-formed v1 blob is corruption as far as the caller cares.
export const decodeCryptoBlob = (ciphertext: string): CryptoBlob => {
  if (!ciphertext.startsWith(CRYPTO_BLOB_PREFIX_V1)) {
    throw new CryptoMalformedCiphertextError('Ciphertext is not a qpq crypto blob (missing/unknown version prefix)');
  }

  let fields: Record<string, unknown>;
  try {
    fields = JSON.parse(Buffer.from(ciphertext.slice(CRYPTO_BLOB_PREFIX_V1.length), 'base64').toString('utf8'));
  } catch {
    throw new CryptoMalformedCiphertextError('Ciphertext blob payload is not decodable');
  }

  const { k, iv, tg, ct, ch } = fields;
  if (typeof k !== 'string' || typeof iv !== 'string' || typeof tg !== 'string' || typeof ct !== 'string' || typeof ch !== 'string') {
    throw new CryptoMalformedCiphertextError('Ciphertext blob is missing required fields');
  }

  return {
    wrappedKey: Buffer.from(k, 'base64'),
    iv: Buffer.from(iv, 'base64'),
    authTag: Buffer.from(tg, 'base64'),
    ciphertext: Buffer.from(ct, 'base64'),
    contextHash: ch,
  };
};
