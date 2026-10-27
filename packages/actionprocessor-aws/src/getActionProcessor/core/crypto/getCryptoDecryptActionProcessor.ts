import { envelopeDecrypt } from 'quidproquo-actionprocessor-node';
import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askCryptoDecrypt,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { createKmsDataKeyProvider, resolveCryptoKeyAlias } from './utils';

const getProcessCryptoDecrypt = (qpqConfig: QPQConfig): ProcessorFor<typeof askCryptoDecrypt> => {
  return async ({ keyName, ciphertext, context }) => {
    const keyAlias = resolveCryptoKeyAlias(keyName, qpqConfig);
    if (!keyAlias) {
      return actionResultError(
        askCryptoDecrypt.errorType.KeyNotConfigured,
        `Crypto key not configured: [${keyName}] - declare it with defineCryptoKey`,
      );
    }

    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const plaintext = await envelopeDecrypt(ciphertext, context, createKmsDataKeyProvider(keyAlias, region));
      return actionResult(plaintext);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        // Named errors from the shared envelope logic, keyed by error.code
        QpqCryptoContextMismatch: (e) => actionResultError(askCryptoDecrypt.errorType.ContextMismatch, e.message),
        QpqCryptoMalformedCiphertext: (e) => actionResultError(askCryptoDecrypt.errorType.MalformedCiphertext, e.message),

        // KMS exceptions, keyed by error.name. The context hash was verified
        // before KMS was called, so an invalid wrapped key means tampering or
        // corruption, not a context mismatch.
        InvalidCiphertextException: () => actionResultError(askCryptoDecrypt.errorType.MalformedCiphertext, 'Wrapped data key is not decryptable'),
        IncorrectKeyException: () =>
          actionResultError(askCryptoDecrypt.errorType.MalformedCiphertext, `Ciphertext was not encrypted under crypto key: [${keyName}]`),
        NotFoundException: () => actionResultError(askCryptoDecrypt.errorType.KeyUnavailable, `Crypto key not found: [${keyName}]`),
        DisabledException: () => actionResultError(askCryptoDecrypt.errorType.KeyUnavailable, `Crypto key is disabled: [${keyName}]`),
        KMSInvalidStateException: () =>
          actionResultError(askCryptoDecrypt.errorType.KeyUnavailable, `Crypto key is in an unusable state: [${keyName}]`),
        AccessDeniedException: () => actionResultError(askCryptoDecrypt.errorType.KeyUnavailable, `Access denied to crypto key: [${keyName}]`),
        ThrottlingException: () => actionResultError(askCryptoDecrypt.errorType.Throttling, 'Throttling: Rate exceeded'),
      });
    }
  };
};

export const getCryptoDecryptActionProcessor = createActionProcessor(askCryptoDecrypt, getProcessCryptoDecrypt);
