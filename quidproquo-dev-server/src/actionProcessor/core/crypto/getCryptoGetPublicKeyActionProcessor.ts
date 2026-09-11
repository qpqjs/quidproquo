import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askCryptoGetPublicKey,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from 'quidproquo-core';

import { getOrSeedSigningKeyPair } from '../../../logic/signingKeys';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessCryptoGetPublicKey = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askCryptoGetPublicKey> => {
  return async ({ keyName }) => {
    const signingKeyConfig = qpqCoreUtils.getAllSigningKeyConfigs(qpqConfig).find((k) => k.keyName === keyName);
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
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getCryptoGetPublicKeyActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askCryptoGetPublicKey, (qpqConfig) => getProcessCryptoGetPublicKey(qpqConfig, devServerConfig));
