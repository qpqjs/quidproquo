import { canonicalizeCryptoContext } from 'quidproquo-actionprocessor-node';
import { CryptoContext } from 'quidproquo-core';

import { decryptDataKey } from './decryptDataKey';

const UNWRAPPED_KEY_MAX_AGE_MS = 5 * 60 * 1000;
const UNWRAPPED_KEY_MAX_ENTRIES = 1000;

type CachedUnwrappedDataKey = {
  plaintextKey: Buffer;
  expiresAt: number;
};

const cache = new Map<string, CachedUnwrappedDataKey>();

export const getCachedUnwrappedDataKey = async (wrappedKey: Buffer, context: CryptoContext, region: string): Promise<Buffer> => {
  const cacheKey = `${region}|${canonicalizeCryptoContext(context)}|${wrappedKey.toString('base64')}`;

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.plaintextKey;
  }

  const plaintextKey = await decryptDataKey(wrappedKey, context, region);

  // Crude eviction so a long-lived runtime decrypting many distinct blobs
  // can't grow the cache without bound
  if (cache.size >= UNWRAPPED_KEY_MAX_ENTRIES) {
    cache.clear();
  }

  cache.set(cacheKey, {
    plaintextKey,
    expiresAt: Date.now() + UNWRAPPED_KEY_MAX_AGE_MS,
  });

  return plaintextKey;
};
