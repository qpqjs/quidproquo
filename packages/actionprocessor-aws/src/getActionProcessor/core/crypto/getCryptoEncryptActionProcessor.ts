import { envelopeEncrypt } from 'quidproquo-actionprocessor-node';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askCryptoEncrypt,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { createKmsDataKeyProvider, resolveCryptoKeyAlias } from './utils';

const getProcessCryptoEncrypt = (qpqConfig: QPQConfig): ProcessorFor<typeof askCryptoEncrypt> => {
  return async ({ keyName, plaintext, context }) => {
    const keyAlias = resolveCryptoKeyAlias(keyName, qpqConfig);
    if (!keyAlias) {
      return actionResultError(
        askCryptoEncrypt.errorType.KeyNotConfigured,
        `Crypto key not configured: [${keyName}] - declare it with defineCryptoKey`,
      );
    }

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const ciphertext = await envelopeEncrypt(plaintext, context, createKmsDataKeyProvider(keyAlias, region));
      return actionResult(ciphertext);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        NotFoundException: () => actionResultError(askCryptoEncrypt.errorType.KeyUnavailable, `Crypto key not found: [${keyName}]`),
        DisabledException: () => actionResultError(askCryptoEncrypt.errorType.KeyUnavailable, `Crypto key is disabled: [${keyName}]`),
        KMSInvalidStateException: () =>
          actionResultError(askCryptoEncrypt.errorType.KeyUnavailable, `Crypto key is in an unusable state: [${keyName}]`),
        AccessDeniedException: () => actionResultError(askCryptoEncrypt.errorType.KeyUnavailable, `Access denied to crypto key: [${keyName}]`),
        ThrottlingException: () => actionResultError(askCryptoEncrypt.errorType.Throttling, 'Throttling: Rate exceeded'),
      });
    }
  };
};

export const getCryptoEncryptActionProcessor = createActionProcessor(askCryptoEncrypt, getProcessCryptoEncrypt);
