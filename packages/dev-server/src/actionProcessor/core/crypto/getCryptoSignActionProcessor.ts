import { rs256Sign } from '@qpqjs/actionprocessor-node';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askCryptoSign,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from '@qpqjs/core';

import { getOrSeedSigningKeyPair } from '../../../logic/signingKeys';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessCryptoSign = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askCryptoSign> => {
  return async ({ keyName, message, messageEncoding }) => {
    const signingKeyConfig = qpqCoreUtils.getSigningKeyByName(keyName, qpqConfig);
    if (!signingKeyConfig) {
      return actionResultError(
        askCryptoSign.errorType.KeyNotConfigured,
        `Signing key not configured: [${keyName}] - declare it with defineSigningKey`,
      );
    }

    // Parity with the deployed grant: only the owning service holds kms:Sign,
    // so a foreign (owner: another module) declaration can verify but not sign.
    if (qpqCoreUtils.getOwnedItems([signingKeyConfig], qpqConfig).length === 0) {
      return actionResultError(askCryptoSign.errorType.KeyUnavailable, `Access denied to signing key: [${keyName}]`);
    }

    try {
      const { privateKeyPem } = await getOrSeedSigningKeyPair(devServerConfig.runtimePath, keyName, qpqConfig);

      return actionResult(rs256Sign(privateKeyPem, message, messageEncoding));
    } catch (error: unknown) {
      // A message that is not the base64 it claims to be must fail in dev exactly
      // as it does in prod; anything else thrown becomes GenericError.
      return actionResultErrorFromCaughtError(error, {
        QpqSigningMalformedMessage: (e) => actionResultError(askCryptoSign.errorType.MalformedMessage, e.message),
      });
    }
  };
};

export const getCryptoSignActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askCryptoSign, (qpqConfig) => getProcessCryptoSign(qpqConfig, devServerConfig));
