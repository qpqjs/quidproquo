import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askCryptoGetPublicKey,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from '@qpqjs/core';

import { getOrSeedSigningKeyPair } from '../../../logic/signingKeys';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessCryptoGetPublicKey = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askCryptoGetPublicKey> => {
  return async ({ keyName }) => {
    const signingKeyConfig = qpqCoreUtils.getSigningKeyByName(keyName, qpqConfig);
    if (!signingKeyConfig) {
      return actionResultError(
        askCryptoGetPublicKey.errorType.KeyNotConfigured,
        `Signing key not configured: [${keyName}] - declare it with defineSigningKey`,
      );
    }

    try {
      const { publicKeyPem } = await getOrSeedSigningKeyPair(devServerConfig.runtimePath, keyName, qpqConfig);

      return actionResult(publicKeyPem);
    } catch (error: unknown) {
      // No local failure maps to a catalog entry here; anything thrown becomes GenericError.
      return actionResultErrorFromCaughtError(error);
    }
  };
};

export const getCryptoGetPublicKeyActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askCryptoGetPublicKey, (qpqConfig) => getProcessCryptoGetPublicKey(qpqConfig, devServerConfig));
