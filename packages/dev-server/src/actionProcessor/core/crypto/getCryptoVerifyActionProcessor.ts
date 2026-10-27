import { rs256Verify } from 'quidproquo-actionprocessor-node';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askCryptoVerify,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from 'quidproquo-core';

import { getOrSeedSigningKeyPair } from '../../../logic/signingKeys';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessCryptoVerify = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askCryptoVerify> => {
  return async ({ keyName, message, signature }) => {
    const signingKeyConfig = qpqCoreUtils.getAllSigningKeyConfigs(qpqConfig).find((k) => k.keyName === keyName);
    if (!signingKeyConfig) {
      return actionResultError(
        askCryptoVerify.errorType.KeyNotConfigured,
        `Signing key not configured: [${keyName}] - declare it with defineSigningKey`,
      );
    }

    try {
      const { publicKeyPem } = await getOrSeedSigningKeyPair(devServerConfig.runtimePath, keyName, qpqConfig);

      return actionResult(rs256Verify(publicKeyPem, message, signature));
    } catch (error: unknown) {
      // A malformed signature must be distinguishable from a bad one in dev
      // exactly as it is in prod
      return actionResultErrorFromCaughtError(error, {
        QpqSigningMalformedSignature: (e) => actionResultError(askCryptoVerify.errorType.MalformedSignature, e.message),
      });
    }
  };
};

export const getCryptoVerifyActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askCryptoVerify, (qpqConfig) => getProcessCryptoVerify(qpqConfig, devServerConfig));
