import { generateRs256KeyPair, Rs256KeyPair } from 'quidproquo-actionprocessor-node';
import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { readJsonFileStore, writeJsonFileStore } from '../jsonFileStore';

// Offline stand-in for an asymmetric KMS key: an RSA-2048 pair per configured
// signing key, generated on first use. Same file layout as the crypto key store:
//
//   <runtimePath>/signingKeys/<serviceName>.json   { "myKey": { privateKeyPem, publicKeyPem } }
//
// Keys are random per checkout, so a dev-signed token never verifies in prod.

const SIGNING_KEYS_STORE_DIRECTORY = 'signingKeys';

export const getOrSeedSigningKeyPair = async (runtimePath: string, signingKeyName: string, qpqConfig: QPQConfig): Promise<Rs256KeyPair> => {
  const signingKeyConfig = qpqCoreUtils.getSigningKeyByName(signingKeyName, qpqConfig);

  // Mirrors the AWS runtime's resolveSigningKeyAlias: a cross-module owner
  // redirects storage to the owning service's file
  const serviceName = signingKeyConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig);
  const key = signingKeyConfig.owner?.resourceNameOverride || signingKeyName;

  const keys = await readJsonFileStore<Rs256KeyPair>(runtimePath, SIGNING_KEYS_STORE_DIRECTORY, serviceName);

  if (key in keys) {
    return keys[key];
  }

  const keyPair = generateRs256KeyPair();
  await writeJsonFileStore(runtimePath, SIGNING_KEYS_STORE_DIRECTORY, serviceName, { ...keys, [key]: keyPair });

  return keyPair;
};
