import { generateRs256KeyPair, Rs256KeyPair } from '@qpqjs/actionprocessor-node';
import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { resolveOwnedStoreLocation } from '../config/resolveOwnedStoreLocation';
import { getOrSeedJsonFileStoreValue } from '../jsonFileStore';

// Offline stand-in for an asymmetric KMS key: an RSA-2048 pair per configured
// signing key, generated on first use. Same file layout as the crypto key store:
//
//   <runtimePath>/signingKeys/<serviceName>.json   { "myKey": { privateKeyPem, publicKeyPem } }
//
// Keys are random per checkout, so a dev-signed token never verifies in prod.

const SIGNING_KEYS_STORE_DIRECTORY = 'signingKeys';

export const getOrSeedSigningKeyPair = async (runtimePath: string, signingKeyName: string, qpqConfig: QPQConfig): Promise<Rs256KeyPair> => {
  const signingKeyConfig = qpqCoreUtils.resolveSigningKeyOrThrow(signingKeyName, qpqConfig);

  const { serviceName, key } = resolveOwnedStoreLocation(signingKeyName, signingKeyConfig.owner, qpqConfig);

  return getOrSeedJsonFileStoreValue(runtimePath, SIGNING_KEYS_STORE_DIRECTORY, serviceName, key, generateRs256KeyPair);
};
