import { generateRs256KeyPair, Rs256KeyPair } from 'quidproquo-actionprocessor-node';
import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import * as path from 'path';

import { readJsonFileStore, writeJsonFileStore } from '../jsonFileStore';

// Offline stand-in for an asymmetric KMS key: an RSA-2048 pair per configured
// signing key, generated on first use. Same file layout as the crypto key store:
//
//   <runtimePath>/signingKeys/<serviceName>.json   { "myKey": { privateKeyPem, publicKeyPem } }
//
// Keys are random per checkout, so a dev-signed token never verifies in prod.

const SIGNING_KEYS_STORE_DIRECTORY = 'signingKeys';

// Concurrent first-use callers (parallel smoke tests on a fresh checkout) must
// share one generation, otherwise each seeds its own pair and last write wins,
// so callers hold different keys for the same name
const inFlightSeeds = new Map<string, Promise<Rs256KeyPair>>();

const readOrSeed = async (runtimePath: string, serviceName: string, key: string): Promise<Rs256KeyPair> => {
  const keys = await readJsonFileStore<Rs256KeyPair>(runtimePath, SIGNING_KEYS_STORE_DIRECTORY, serviceName);

  if (key in keys) {
    return keys[key];
  }

  const keyPair = generateRs256KeyPair();
  await writeJsonFileStore(runtimePath, SIGNING_KEYS_STORE_DIRECTORY, serviceName, { ...keys, [key]: keyPair });

  return keyPair;
};

export const getOrSeedSigningKeyPair = async (runtimePath: string, signingKeyName: string, qpqConfig: QPQConfig): Promise<Rs256KeyPair> => {
  const signingKeyConfig = qpqCoreUtils.getSigningKeyByName(signingKeyName, qpqConfig);

  // Mirrors the AWS runtime's resolveSigningKeyAlias: a cross-module owner
  // redirects storage to the owning service's file
  const serviceName = signingKeyConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig);
  const key = signingKeyConfig.owner?.resourceNameOverride || signingKeyName;

  const seedKey = path.join(runtimePath, serviceName, key);
  const inFlight = inFlightSeeds.get(seedKey);
  if (inFlight) {
    return inFlight;
  }

  const seed = readOrSeed(runtimePath, serviceName, key).finally(() => inFlightSeeds.delete(seedKey));
  inFlightSeeds.set(seedKey, seed);

  return seed;
};
