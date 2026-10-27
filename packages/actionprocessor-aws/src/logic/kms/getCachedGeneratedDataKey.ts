import { canonicalizeCryptoContext, GeneratedDataKey } from 'quidproquo-actionprocessor-node';
import { CryptoContext } from 'quidproquo-core';

import { generateDataKey } from './generateDataKey';

// A data key is reused across encrypts for the same key + context so most
// askCryptoEncrypt calls never touch KMS. Bounded by age and use count; each
// encrypt still gets a fresh random IV, so reuse within these limits is safe.
const DATA_KEY_MAX_AGE_MS = 5 * 60 * 1000;
const DATA_KEY_MAX_USES = 500;

type CachedGeneratedDataKey = {
  dataKey: GeneratedDataKey;
  expiresAt: number;
  remainingUses: number;
};

const cache = new Map<string, CachedGeneratedDataKey>();

export const getCachedGeneratedDataKey = async (keyAlias: string, context: CryptoContext, region: string): Promise<GeneratedDataKey> => {
  const cacheKey = `${region}|${keyAlias}|${canonicalizeCryptoContext(context)}`;

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() && cached.remainingUses > 0) {
    cached.remainingUses -= 1;
    return cached.dataKey;
  }

  const dataKey = await generateDataKey(keyAlias, context, region);

  cache.set(cacheKey, {
    dataKey,
    expiresAt: Date.now() + DATA_KEY_MAX_AGE_MS,
    remainingUses: DATA_KEY_MAX_USES - 1,
  });

  return dataKey;
};
