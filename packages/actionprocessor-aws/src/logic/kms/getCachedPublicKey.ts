import { spkiDerToPem } from 'quidproquo-actionprocessor-node';

import { GetPublicKeyCommand, KMSClient } from '@aws-sdk/client-kms';

import { createAwsClient } from '../createAwsClient';

// The public half of a signing key is immutable for the life of the key, so it is
// fetched once per alias per runtime and verification runs locally from then on:
// askCryptoVerify costs no KMS call after warm-up, and needs no kms:Verify grant.
// Bounded by age only so a key replaced under the same alias is picked up.
const PUBLIC_KEY_MAX_AGE_MS = 60 * 60 * 1000;

type CachedPublicKey = {
  publicKeyPem: string;
  expiresAt: number;
};

const cache = new Map<string, CachedPublicKey>();

export const getCachedPublicKey = async (keyAlias: string, region: string): Promise<string> => {
  const cacheKey = `${region}|${keyAlias}`;

  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.publicKeyPem;
  }

  const kmsClient = createAwsClient(KMSClient, {
    region,
  });

  const response = await kmsClient.send(
    new GetPublicKeyCommand({
      KeyId: keyAlias,
    }),
  );

  if (!response.PublicKey) {
    throw new Error(`KMS returned no public key for [${keyAlias}]`);
  }

  const publicKeyPem = spkiDerToPem(Buffer.from(response.PublicKey));

  cache.set(cacheKey, {
    publicKeyPem,
    expiresAt: Date.now() + PUBLIC_KEY_MAX_AGE_MS,
  });

  return publicKeyPem;
};
