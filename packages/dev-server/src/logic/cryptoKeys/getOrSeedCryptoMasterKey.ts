import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { randomBytes } from 'crypto';

import { readJsonFileStore, writeJsonFileStore } from '../jsonFileStore';

// Offline stand-in for a KMS CMK: a 32-byte master key per configured crypto
// key, seeded on first use. Same file layout as the parameter/secret stores:
//
//   <runtimePath>/cryptoKeys/<serviceName>.json   { "myKey": "<base64 32 bytes>" }
//
// Values are random per checkout, so dev ciphertext is never readable in prod
// (or another dev machine) - only round-trip behaviour matters here.

const CRYPTO_KEYS_STORE_DIRECTORY = 'cryptoKeys';

export const getOrSeedCryptoMasterKey = async (runtimePath: string, cryptoKeyName: string, qpqConfig: QPQConfig): Promise<Buffer> => {
  const cryptoKeyConfig = qpqCoreUtils.getCryptoKeyByName(cryptoKeyName, qpqConfig);

  // Mirrors the AWS runtime's resolveCryptoKeyAlias: a cross-module owner
  // redirects storage to the owning service's file
  const serviceName = cryptoKeyConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig);
  const key = cryptoKeyConfig.owner?.resourceNameOverride || cryptoKeyName;

  const keys = await readJsonFileStore<string>(runtimePath, CRYPTO_KEYS_STORE_DIRECTORY, serviceName);

  if (key in keys) {
    return Buffer.from(keys[key], 'base64');
  }

  const masterKey = randomBytes(32);
  await writeJsonFileStore(runtimePath, CRYPTO_KEYS_STORE_DIRECTORY, serviceName, { ...keys, [key]: masterKey.toString('base64') });

  return masterKey;
};
