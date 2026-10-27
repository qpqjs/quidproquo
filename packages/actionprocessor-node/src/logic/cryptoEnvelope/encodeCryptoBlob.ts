import { CryptoBlob } from './CryptoBlob';
import { CRYPTO_BLOB_PREFIX_V1 } from './cryptoBlobPrefix';

export const encodeCryptoBlob = (blob: CryptoBlob): string => {
  const json = JSON.stringify({
    k: blob.wrappedKey.toString('base64'),
    iv: blob.iv.toString('base64'),
    tg: blob.authTag.toString('base64'),
    ct: blob.ciphertext.toString('base64'),
    ch: blob.contextHash,
  });

  return `${CRYPTO_BLOB_PREFIX_V1}${Buffer.from(json, 'utf8').toString('base64')}`;
};
